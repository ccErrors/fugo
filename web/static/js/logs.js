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
        {% for field in fields %}
        <td>{{ log[field] }}</td>
        {% endfor %}
    </tr>
`;

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

function loadAgentLogs(agentName) {
    fetch(`/api/schema/${agentName}`)
        .then(response => response.json())
        .then(schemaData => {
            const schema = schemaData.schema;

            // Render the table with headers
            const tableHtml = nunjucks.renderString(tableTemplate, { schema: schema });
            document.getElementById('logs-container').innerHTML = tableHtml;

            const fields = schema.map(field => field.name); // only field names
            // Save fields for later use
            document.getElementById('logs-container').dataset.fields = JSON.stringify(fields);

            // Load the records
            return fetch(`/api/query/${agentName}?limit=100`);
        })
        .then(response => response.text())
        .then(text => {
            const lines = text.trim().split('\n');
            const logs = lines.map(line => JSON.parse(line))
            const logsBody = document.getElementById('logs-body');

            const fields = JSON.parse(document.getElementById('logs-container').dataset.fields);

            let rowsHtml = '';

            logs.forEach(log => {
                rowsHtml += nunjucks.renderString(rowTemplate, { log: log, fields: fields });
            });

            logsBody.innerHTML = rowsHtml;
        })
        .catch(error => {
            console.error('Failed to load agent logs:', error);
        });
}

document.addEventListener('DOMContentLoaded', loadAgents);

