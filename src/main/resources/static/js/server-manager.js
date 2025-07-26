// Server management functionality

document.addEventListener('DOMContentLoaded', function() {
    // Server Elements
    const serverSelect = document.getElementById('server-select');
    const connectBtn = document.getElementById('connect-btn');
    const addServerBtn = document.getElementById('add-server-btn');

    // Initialize
    loadServerList();

    // Load server list from API
    function loadServerList() {
        fetch(window.apiBaseUrl + '/servers')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Failed to load servers: ${response.status} ${response.statusText}`);
                }
                return response.json();
            })
            .then(data => {
                serverSelect.innerHTML = '';

                if (data.length === 0) {
                    const option = document.createElement('option');
                    option.value = '';
                    option.textContent = 'No servers configured';
                    serverSelect.appendChild(option);
                    return;
                }

                // Get current server
                fetch(window.apiBaseUrl + '/servers/current')
                    .then(response => response.text())
                    .then(currentServer => {
                        data.forEach(server => {
                            const option = document.createElement('option');
                            option.value = server.address;
                            option.textContent = `${server.name} (${server.address})`;
                            if (server.address === currentServer) {
                                option.selected = true;
                            }
                            serverSelect.appendChild(option);
                        });

                        // Add custom server option if needed
                        const customOption = document.createElement('option');
                        customOption.value = 'custom';
                        customOption.textContent = '-- Add custom server --';
                        serverSelect.appendChild(customOption);
                    });
            })
            .catch(error => {
                console.error('Error loading servers:', error);
                const option = document.createElement('option');
                option.value = '';
                option.textContent = 'Error loading servers';
                serverSelect.appendChild(option);
            });
    }

    // Connect to selected server
    connectBtn.addEventListener('click', function() {
        const selectedServer = serverSelect.value;

        if (!selectedServer) {
            showError('Please select a server');
            return;
        }

        if (selectedServer === 'custom') {
            showAddServerModal();
            return;
        }

        connectToServer(selectedServer);
    });

    // Handle server selection change
    serverSelect.addEventListener('change', function() {
        if (this.value === 'custom') {
            showAddServerModal();
        }
    });

    // Add server button
    addServerBtn.addEventListener('click', function() {
        showAddServerModal();
    });

    // Connect to server
    function connectToServer(serverAddress) {
        // Update UI to loading state
        statusIcon.className = 'spinner-border spinner-border-sm me-2';
        statusMessage.textContent = `Connecting to ${serverAddress}...`;
        connectionStatus.className = 'alert alert-info mb-3 d-flex justify-content-between align-items-center';
        connectBtn.disabled = true;

        fetch(`${window.apiBaseUrl}/servers/connect`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                address: serverAddress
            })
        })
        .then(response => {
            connectBtn.disabled = false;
            if (!response.ok) {
                throw new Error(`Failed to connect: ${response.status} ${response.statusText}`);
            }

            // Connection successful, refresh the UI
            statusIcon.className = 'bi bi-check-circle-fill me-2';
            statusMessage.textContent = `Connected to ${serverAddress}`;
            connectionStatus.className = 'alert alert-success mb-3 d-flex justify-content-between align-items-center';

            // Reload parent nodes
            checkConnectionStatus();
        })
        .catch(error => {
            connectBtn.disabled = false;
            statusIcon.className = 'bi bi-x-circle-fill me-2';
            statusMessage.textContent = `Failed to connect: ${error.message}`;
            connectionStatus.className = 'alert alert-danger mb-3 d-flex justify-content-between align-items-center';
            showError('Connection failed: ' + error.message);
        });
    }

    // Show Add Server Modal
    function showAddServerModal() {
        // Create modal dynamically if it doesn't exist
        let addServerModal = document.getElementById('add-server-modal');

        if (!addServerModal) {
            const modalHtml = `
                <div class="modal fade" id="add-server-modal" tabindex="-1" aria-hidden="true">
                    <div class="modal-dialog">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">Add ZooKeeper Server</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body">
                                <form id="add-server-form">
                                    <div class="mb-3">
                                        <label for="server-name" class="form-label">Server Name</label>
                                        <input type="text" class="form-control" id="server-name" required placeholder="Production Environment">
                                    </div>
                                    <div class="mb-3">
                                        <label for="server-address" class="form-label">Server Address</label>
                                        <input type="text" class="form-control" id="server-address" required placeholder="hostname:port,hostname:port">
                                        <div class="form-text">Format: hostname:port or multiple servers comma-separated</div>
                                    </div>
                                </form>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                                <button type="button" class="btn btn-primary" id="save-server-btn">Save & Connect</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // Append modal to body
            document.body.insertAdjacentHTML('beforeend', modalHtml);
            addServerModal = document.getElementById('add-server-modal');

            // Initialize Bootstrap modal
            const bsModal = new bootstrap.Modal(addServerModal);

            // Add event listener for save button
            document.getElementById('save-server-btn').addEventListener('click', function() {
                const serverNameInput = document.getElementById('server-name');
                const serverAddressInput = document.getElementById('server-address');

                const serverName = serverNameInput.value.trim();
                const serverAddress = serverAddressInput.value.trim();

                if (!serverName || !serverAddress) {
                    alert('Please fill in all fields');
                    return;
                }

                // Close modal
                bsModal.hide();

                // Connect to the server
                connectToServer(serverAddress);

                // Add new option to select dropdown
                const option = document.createElement('option');
                option.value = serverAddress;
                option.textContent = `${serverName} (${serverAddress})`;
                option.selected = true;

                // Add before the custom option
                const customOption = serverSelect.querySelector('option[value="custom"]');
                serverSelect.insertBefore(option, customOption);
            });
        }

        // Show modal
        const bsModal = new bootstrap.Modal(addServerModal);
        bsModal.show();

        // Reset form
        const form = document.getElementById('add-server-form');
        if (form) form.reset();
    }

    // Expose functions for use in other scripts
    window.serverManager = {
        loadServerList: loadServerList,
        connectToServer: connectToServer
    };
});
