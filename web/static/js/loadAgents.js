const agentsTemplate = `
    {% for agent in agents %}
      <button>{{ agent }}</button>
    {% endfor %}
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

document.addEventListener('DOMContentLoaded', loadAgents);
