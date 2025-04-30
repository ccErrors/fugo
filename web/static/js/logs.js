const agentsTemplate = `
    {% for agent in agents %}
        <li>
            <a onclick="loadAgentLogs('{{ agent }}')" class="nav-link text-white">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-list-task" viewBox="0 0 16 16">
                    <path fill-rule="evenodd" d="M2 2.5a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5V3a.5.5 0 0 0-.5-.5zM3 3H2v1h1z"/>
                    <path d="M5 3.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5M5.5 7a.5.5 0 0 0 0 1h9a.5.5 0 0 0 0-1zm0 4a.5.5 0 0 0 0 1h9a.5.5 0 0 0 0-1z"/>
                    <path fill-rule="evenodd" d="M1.5 7a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5H2a.5.5 0 0 1-.5-.5zM2 7h1v1H2zm0 3.5a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5zm1 .5H2v1h1z"/>
                </svg>
                {{ agent }}
            </a>
        </li>
    {% endfor %}
`;

const tableTemplate = `
    <table class="table table-striped-columns table-sm m-4">
        <thead>
            <tr>
                {% for field in schema %}
                <th>{{ field.name }}</th>
                {% endfor %}
            </tr>
        </thead>
        <tbody id="logs-body" class="table-group-divider">
        </tbody>
    </table>
`;

const rowTemplate = `
    <tr>
        {% for tdElement in tds %}
        <td>{{ tdElement }}</td>
        {% endfor %}
    </tr>
`;

const LIMIT = 100;

var prevCursor = null;
var nextCursor = null;

var lastCursor = {
    prev: null,
    next: null
}

function loadAgents() {
    fetch('/api/agents')
        .then(response => response.json())
        .then(data => {
        const html = nunjucks.renderString(agentsTemplate, { agents: data.agents });
        document.getElementById('agents-container').innerHTML = html;
        })
        .catch(error => {
        console.error('Failed to load agents:', error);
        });
}

function loadAgentLogs(agentName, after = null, before = null) {
    console.log(agentName, after, before);
    currentAgentName = agentName;
    var fields = [];
    
    fetch(`/api/schema/${agentName}`)
        .then(response => response.json())
        .then(schemaData => {
            fields = schemaData.schema;

            // Render the table with headers
            const tableHtml = nunjucks.renderString(tableTemplate, { schema: fields });
            document.getElementById('logs-container').innerHTML = tableHtml;

            // Load the records
            let url = `/api/query/${agentName}?limit=${LIMIT}`;
            if (after) url += `&after=${after}`;
            if (before) url += `&before=${before}`;

            return fetch(url);
        })
        .then(response => response.text())
        .then(text => {
            var canReturnToNext = false;
            var canReturnToPrev = false;

            const lines = text.trim().split('\n');

            const logs = lines.flatMap(line => {
                try {
                    return [JSON.parse(line)];
                } catch {
                    return [];
                }
            });

            if (Array.isArray(logs) && logs.length > 0) {
                nextCursor = logs[logs.length - 1]._cursor;
                prevCursor = logs[0]._cursor;

                lastCursor.prev = prevCursor;
                lastCursor.next = nextCursor;
            } else {
                nextCursor = null;
                prevCursor = null;

                if (before) {
                    canReturnToNext = true;
                }

                if (after) {
                    canReturnToPrev = true;
                }
            }

            const logsBody = document.getElementById('logs-body');

            let rowsHtml = '';

            logs.forEach(log => {
                var tds = []

                fields.forEach(field => {
                    const key = field.name;
                    const keyType = field.type;
            
                    if (keyType === 'time') {
                        tds.push(formatTimestamp(log[key]));
                    } else {
                        tds.push(log[key]);
                    }
                });

                rowsHtml += nunjucks.renderString(rowTemplate, { tds: tds });
            });

            logsBody.innerHTML = rowsHtml;

            const btnPrev = document.getElementById('btn-prev');
            const btnNext = document.getElementById('btn-next');

            btnPrev.disabled = !(prevCursor || canReturnToPrev);
            btnNext.disabled = !(nextCursor || canReturnToNext);
        })
        .catch(error => {
            console.error('Failed to load agent logs:', error);
        });
}

function formatTimestamp(value) {
    return new Date(value).toLocaleString();
}

document.addEventListener('DOMContentLoaded', () => {
    loadAgents();

    document.getElementById('btn-prev').addEventListener('click', () => {
        if (!prevCursor) {
            prevCursor = lastCursor.prev;
        }

        if (currentAgentName) {
            loadAgentLogs(currentAgentName, null, prevCursor);
        }
    });

    document.getElementById('btn-next').addEventListener('click', () => {
        if (!nextCursor) {
            prevCursor = lastCursor.prev;
        }

        if (currentAgentName) {
            loadAgentLogs(currentAgentName, nextCursor, null);
        }
    });
});
