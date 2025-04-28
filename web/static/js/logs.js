const agentsTemplate = `
    {% for agent in agents %}
        <button onclick="loadAgentLogs('{{ agent }}')">{{ agent }}</button>
    {% endfor %}
`;

const tableTemplate = `
    <table border="1">
        <thead>
            <tr>
                {% for field in schema %}
                <th>{{ field.name }}</th>
                {% endfor %}
            </tr>
        </thead>
        <tbody id="logs-body">
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
    console.log('Loading logs for agent:', agentName);
    
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

