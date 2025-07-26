document.addEventListener('DOMContentLoaded', function() {
    // UI Elements
    const parentNodesContainer = document.getElementById('parentNodes');
    const configItemsContainer = document.getElementById('configItems');
    const currentParentSpan = document.getElementById('currentParent');
    const addConfigBtn = document.getElementById('addConfigBtn');
    const connectionStatus = document.getElementById('connection-status');
    const statusIcon = document.getElementById('status-icon');
    const statusMessage = document.getElementById('status-message');
    const reloadBtn = document.getElementById('reload-btn');

    // Server Selection Elements
    const serverSelect = document.getElementById('server-select');
    const connectBtn = document.getElementById('connect-btn');
    const addServerBtn = document.getElementById('add-server-btn');

    // Modal Elements
    const configModal = new bootstrap.Modal(document.getElementById('configModal'));
    const confirmModal = new bootstrap.Modal(document.getElementById('confirmModal'));
    const configForm = document.getElementById('configForm');
    const configKey = document.getElementById('configKey');
    const configValue = document.getElementById('configValue');
    const saveConfigBtn = document.getElementById('saveConfigBtn');
    const deleteKeySpan = document.getElementById('deleteKey');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

    // Toast Elements
    const successToast = new bootstrap.Toast(document.getElementById('successToast'));
    const errorToast = new bootstrap.Toast(document.getElementById('errorToast'));
    const successMessage = document.getElementById('successMessage');
    const errorMessage = document.getElementById('errorMessage');

    // State
    let currentParent = null;
    let isEditing = false;
    let currentKeyToEdit = null;
    let currentKeyToDelete = null;

    // Initialize
    console.log('Checking connection status first...');
    checkConnectionStatus();

    // Event listener for reload button
    reloadBtn.addEventListener('click', function() {
        checkConnectionStatus();
    });

    // Load parent nodes
    function loadParentNodes() {
        console.log('Fetching parent nodes from API...');
        // Use the dynamic API base URL
        fetch(window.apiBaseUrl + '/config/parent')
            .then(response => {
                console.log('Parent nodes API response status:', response.status);
                if (!response.ok) {
                    throw new Error(`Failed to load parent nodes: ${response.status} ${response.statusText}`);
                }
                return response.json();
            })
            .then(data => {
                parentNodesContainer.innerHTML = '';
                data.forEach(node => {
                    const item = document.createElement('a');
                    item.href = '#';
                    item.className = 'list-group-item list-group-item-action';
                    item.textContent = node;
                    item.addEventListener('click', () => selectParentNode(node));
                    parentNodesContainer.appendChild(item);
                });
            })
            .catch(error => {
                showError('Error loading parent nodes: ' + error.message);
                parentNodesContainer.innerHTML = '<p class="text-danger p-3">Error loading parent nodes</p>';
            });
    }

    // Select a parent node
    function selectParentNode(parent) {
        currentParent = parent;
        currentParentSpan.textContent = parent;
        addConfigBtn.disabled = false;

        // Highlight selected node
        document.querySelectorAll('#parentNodes a').forEach(node => {
            node.classList.remove('active');
            if (node.textContent === parent) {
                node.classList.add('active');
            }
        });

        loadConfigurations(parent);
    }

    // Load configurations for a parent
    function loadConfigurations(parent) {
        configItemsContainer.innerHTML = `
            <div class="loading">
                <div class="spinner-border text-success" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
            </div>
        `;

                    fetch(`${window.apiBaseUrl}/config?parent=${encodeURIComponent(parent)}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to load configurations');
                }
                return response.json();
            })
            .then(data => {
                configItemsContainer.innerHTML = '';

                if (Object.keys(data).length === 0) {
                    configItemsContainer.innerHTML = '<p class="text-center text-muted">No configurations found</p>';
                    return;
                }

                for (const [key, value] of Object.entries(data)) {
                    const configDiv = document.createElement('div');
                    configDiv.className = 'config-item';
                    // Check if value is long and should be truncated in display
                    const displayValue = value.length > 100 ? value.substring(0, 100) + '...' : value;

                    // Create elements programmatically rather than using innerHTML
                    // to better handle long or complex values
                    const rowDiv = document.createElement('div');
                    rowDiv.className = 'row align-items-center';

                    const keyDiv = document.createElement('div');
                    keyDiv.className = 'col-md-4 fw-bold';
                    keyDiv.textContent = key;

                    const valueDiv = document.createElement('div');
                    valueDiv.className = 'col-md-6 config-value';
                    valueDiv.title = value;
                    valueDiv.textContent = displayValue;

                    const actionsDiv = document.createElement('div');
                    actionsDiv.className = 'col-md-2 text-end';

                    const editBtn = document.createElement('button');
                    editBtn.className = 'btn btn-sm btn-outline-primary btn-action edit-btn';
                    editBtn.textContent = 'Edit';
                    editBtn.dataset.key = key;
                    editBtn.dataset.value = value; // Use dataset property to store full value

                    const deleteBtn = document.createElement('button');
                    deleteBtn.className = 'btn btn-sm btn-outline-danger btn-action delete-btn';
                    deleteBtn.textContent = 'Delete';
                    deleteBtn.dataset.key = key;

                    actionsDiv.appendChild(editBtn);
                    actionsDiv.appendChild(deleteBtn);

                    rowDiv.appendChild(keyDiv);
                    rowDiv.appendChild(valueDiv);
                    rowDiv.appendChild(actionsDiv);

                    configDiv.appendChild(rowDiv);
                    configItemsContainer.appendChild(configDiv);
                }

                // Add event listeners for edit and delete buttons
                document.querySelectorAll('.edit-btn').forEach(btn => {
                    btn.addEventListener('click', function() {
                        const key = this.getAttribute('data-key');
                        // Get the actual value from the dataset property which preserves the full string
                        // rather than using the attribute which might be truncated
                        const value = this.dataset.value;
                        openEditModal(key, value);
                    });
                });

                document.querySelectorAll('.delete-btn').forEach(btn => {
                    btn.addEventListener('click', function() {
                        const key = this.getAttribute('data-key');
                        openDeleteConfirmation(key);
                    });
                });
            })
            .catch(error => {
                showError('Error loading configurations: ' + error.message);
                configItemsContainer.innerHTML = '<p class="text-danger">Error loading configurations</p>';
            });
    }

    // Open modal for adding a new configuration
    addConfigBtn.addEventListener('click', function() {
        isEditing = false;
        configKey.value = '';
        configValue.value = '';
        configKey.disabled = false;
        document.getElementById('configModalLabel').textContent = 'Add Configuration';
        configModal.show();
    });

    // Open modal for editing a configuration
    function openEditModal(key, value) {
        isEditing = true;
        currentKeyToEdit = key;

        // Reset and prepare the form elements
        configKey.value = key;
        configValue.value = ''; // Clear first to avoid potential rendering issues
        setTimeout(() => {
            configValue.value = value; // Set value after a brief delay to ensure proper rendering
            configValue.style.height = 'auto'; // Reset height
            configValue.style.height = Math.min(configValue.scrollHeight + 10, 300) + 'px'; // Adjust height to content
        }, 50);

        configKey.disabled = true;
        document.getElementById('configModalLabel').textContent = 'Edit Configuration';
        configModal.show();
    }

    // Open confirmation modal for deleting a configuration
    function openDeleteConfirmation(key) {
        currentKeyToDelete = key;
        deleteKeySpan.textContent = key;
        confirmModal.show();
    }

    // Save configuration (add or update)
    saveConfigBtn.addEventListener('click', function() {
        if (!configForm.checkValidity()) {
            configForm.reportValidity();
            return;
        }

        const key = configKey.value.trim();
        const value = configValue.value.trim();
        const updates = {};
        updates[key] = value;

        fetch(`${window.apiBaseUrl}/config?parent=${encodeURIComponent(currentParent)}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updates)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to save configuration');
            }
            configModal.hide();
            loadConfigurations(currentParent);
            showSuccess(isEditing ? 'Configuration updated successfully' : 'Configuration added successfully');
        })
        .catch(error => {
            showError('Error saving configuration: ' + error.message);
        });
    });

    // Delete configuration
    confirmDeleteBtn.addEventListener('click', function() {
        fetch(`${window.apiBaseUrl}/config/${encodeURIComponent(currentKeyToDelete)}?parent=${encodeURIComponent(currentParent)}`, {
            method: 'DELETE'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to delete configuration');
            }
            confirmModal.hide();
            loadConfigurations(currentParent);
            showSuccess('Configuration deleted successfully');
        })
        .catch(error => {
            showError('Error deleting configuration: ' + error.message);
        });
    });

    // Show success toast
    function showSuccess(message) {
        successMessage.textContent = message;
        successToast.show();
    }

    // Show error toast
    function showError(message) {
        errorMessage.textContent = message;
        errorToast.show();
    }

    // Check connection status
    function checkConnectionStatus() {
        // Reset UI to loading state
        statusIcon.className = 'spinner-border spinner-border-sm me-2';
        statusMessage.textContent = 'Checking connection status...';
        connectionStatus.className = 'alert alert-info mb-3 d-flex justify-content-between align-items-center';

        // Clear existing content
        parentNodesContainer.innerHTML = `
            <div class="loading">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
            </div>
        `;
        configItemsContainer.innerHTML = '<p class="text-center text-muted">Select a parent node to view configurations</p>';
        currentParentSpan.textContent = 'Select a parent node';
        addConfigBtn.disabled = true;
        currentParent = null;

        // Check health endpoint
        fetch(window.apiBaseUrl + '/health')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Health check failed: ${response.status} ${response.statusText}`);
                }
                return response.json();
            })
            .then(data => {
                console.log('Health check response:', data);

                // Update server selector if available
                if (window.serverManager) {
                    window.serverManager.loadServerList();
                }

                if (data.status === 'connected') {
                    statusIcon.className = 'bi bi-check-circle-fill me-2';
                    statusMessage.textContent = `Connected to ZooKeeper server: ${data.server}`;
                    connectionStatus.className = 'alert alert-success mb-3 d-flex justify-content-between align-items-center';
                    loadParentNodes();
                } else {
                    statusIcon.className = 'bi bi-exclamation-triangle-fill me-2';
                    statusMessage.textContent = `Disconnected from ZooKeeper. Server: ${data.server}`;
                    connectionStatus.className = 'alert alert-warning mb-3 d-flex justify-content-between align-items-center';
                    parentNodesContainer.innerHTML = '<p class="text-warning p-3">Not connected to ZooKeeper. Please select a server and connect.</p>';
                }
            })
            .catch(error => {
                console.error('Health check failed:', error);
                statusIcon.className = 'bi bi-x-circle-fill me-2';
                statusMessage.textContent = 'Failed to connect to server: ' + error.message;
                connectionStatus.className = 'alert alert-danger mb-3 d-flex justify-content-between align-items-center';
                parentNodesContainer.innerHTML = '<p class="text-danger p-3">Connection error. Please check if the server is running.</p>';
                showError('Connection error: ' + error.message);
            });
    }
});
