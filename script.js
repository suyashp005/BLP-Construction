const API_URL = 'http://localhost:3000/api';

// Smooth scroll to section
function scrollToSection(sectionId) {
    const element = document.getElementById(sectionId);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
    }
}

function navigateTo(page) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    // Show selected page
    document.getElementById(page).classList.add('active');
    // Update nav button active state
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-page="${page}"]`).classList.add('active');

    // Load page-specific data
    if (page === 'dashboard') {
        loadDashboard();
    } else if (page === 'trucks') {
        loadTrucks();
    } else if (page === 'trips') {
        loadTrips();
    } else if (page === 'invoices') {
        loadInvoices();
    } else if (page === 'pending') {
        loadPendingTrips();
    }
}

// Modal Functions
function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.classList.remove('active');
    }
}

// Truck Functions
function openAddTruckModal() {
    document.getElementById('truckId').value = '';
    document.getElementById('truckForm').reset();
    document.getElementById('truckModalTitle').textContent = 'Add New Truck';
    openModal('truckModal');
}

function editTruck(truckId) {
    fetch(`${API_URL}/trucks/${truckId}`)
        .then(res => res.json())
        .then(truck => {
            document.getElementById('truckId').value = truck._id;
            document.getElementById('truckNumber').value = truck.truckNumber;
            document.getElementById('truckName').value = truck.truckName || '';
            document.getElementById('truckCapacity').value = truck.capacity || '';
            document.getElementById('truckStatus').value = truck.status || 'active';
            document.getElementById('truckModalTitle').textContent = 'Edit Truck';
            openModal('truckModal');
        })
        .catch(err => showMessage('Error loading truck', 'error'));
}

function saveTruck(event) {
    event.preventDefault();
    const truckId = document.getElementById('truckId').value;
    const data = {
        truckNumber: document.getElementById('truckNumber').value,
        truckName: document.getElementById('truckName').value,
        capacity: parseFloat(document.getElementById('truckCapacity').value) || 0,
        status: document.getElementById('truckStatus').value,
        owner: 'SWAPNIL PANDEY'
    };

    const method = truckId ? 'PUT' : 'POST';
    const url = truckId ? `${API_URL}/trucks/${truckId}` : `${API_URL}/trucks`;

    fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(async res => {
        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
            const msg = body.message || 'Unable to save truck';
            showMessage(msg, 'error');
            throw new Error(msg);
        }
        return body;
    })
    .then(data => {
        showMessage('Truck saved successfully', 'success');
        closeModal('truckModal');
        loadTrucks();
        loadTrips(); // Reload trips to update truck names
    })
    .catch(err => {
        console.error('Save truck failed:', err);
    });
}

function deleteTruck(truckId) {
    if (confirm('Are you sure you want to delete this truck?')) {
        fetch(`${API_URL}/trucks/${truckId}`, { method: 'DELETE' })
            .then(res => res.json())
            .then(data => {
                showMessage('Truck deleted successfully', 'success');
                loadTrucks();
            })
            .catch(err => showMessage('Error deleting truck', 'error'));
    }
}

function loadTrucks() {
    fetch(`${API_URL}/trucks`)
        .then(res => res.json())
        .then(trucks => {
            const tbody = document.getElementById('trucksTableBody');
            if (trucks.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #999;">No trucks added</td></tr>';
                return;
            }

            tbody.innerHTML = trucks.map(truck => `
                <tr>
                    <td><strong>${truck.truckNumber}</strong></td>
                    <td>${truck.truckName || '-'}</td>
                    <td>${truck.capacity || '-'}</td>
                    <td><span class="status-badge status-${truck.status}">${truck.status}</span></td>
                    <td>
                        <button class="btn-secondary" onclick="editTruck('${truck._id}')">Edit</button>
                        <button class="btn-danger" onclick="deleteTruck('${truck._id}')">Delete</button>
                    </td>
                </tr>
            `).join('');

            // Load truck options for trip form
            const select = document.getElementById('tripTruck');
            select.innerHTML = '<option value="">Select a truck</option>' + 
                trucks.map(truck => `<option value="${truck._id}">${truck.truckNumber} - ${truck.truckName || 'N/A'}</option>`).join('');
        })
        .catch(err => console.error('Error loading trucks:', err));
}

// Trip Functions
function openAddTripModal() {
    document.getElementById('tripId').value = '';
    document.getElementById('tripForm').reset();
    document.getElementById('tripModalTitle').textContent = 'Add New Trip';
    openModal('tripModal');
}

// helper to update total amount field when amount or number of trips changes
function updateTotalAmountField() {
    const amt = parseFloat(document.getElementById('amount').value) || 0;
    const count = parseInt(document.getElementById('numberOfTrips').value) || 0;
    if (amt && count) {
        document.getElementById('totalAmount').value = (amt * count).toFixed(2);
    } else {
        document.getElementById('totalAmount').value = '';
    }
}

// attach listeners
['amount','numberOfTrips'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
        el.addEventListener('input', updateTotalAmountField);
    }
});

function editTrip(tripId) {
    fetch(`${API_URL}/trips/${tripId}`)
        .then(res => res.json())
        .then(trip => {
            document.getElementById('tripId').value = trip._id;
            document.getElementById('tripTruck').value = trip.truck._id;
            document.getElementById('customerName').value = trip.customer ? trip.customer.name : '';
            document.getElementById('customerPhone').value = trip.customer ? (trip.customer.contactNumber || '') : '';
            document.getElementById('customerAddress').value = trip.customer ? (trip.customer.address || '') : '';
            document.getElementById('loadingLocation').value = trip.loadingLocation;
            document.getElementById('unloadingLocation').value = trip.unloadingLocation;
            document.getElementById('loadingDate').value = trip.loadingDate.split('T')[0];
            document.getElementById('unloadingDate').value = trip.unloadingDate.split('T')[0];
            document.getElementById('materialType').value = trip.materialType || '';
            document.getElementById('weight').value = trip.weight;
            document.getElementById('amount').value = trip.amount;
            document.getElementById('numberOfTrips').value = trip.numberOfTrips || '';
            document.getElementById('totalAmount').value = trip.totalAmount || trip.amount || '';
            document.getElementById('amountPaid').value = trip.amountPaid;
            document.getElementById('tripNotes').value = trip.notes || '';
            document.getElementById('tripModalTitle').textContent = 'Edit Trip';
            // recalc total amount in case amount/number changed
            updateTotalAmountField();
            openModal('tripModal');
        })
        .catch(err => showMessage('Error loading trip', 'error'));
}

function saveTrip(event) {
    event.preventDefault();
    const tripId = document.getElementById('tripId').value;
    const numberOfTrips = parseInt(document.getElementById('numberOfTrips').value) || undefined;
    const totalAmount = parseFloat(document.getElementById('totalAmount').value) || undefined;

    // gather values
    const data = {
        truck: document.getElementById('tripTruck').value,
        customerName: document.getElementById('customerName').value,
        customerPhone: document.getElementById('customerPhone').value,
        customerAddress: document.getElementById('customerAddress').value,
        loadingLocation: document.getElementById('loadingLocation').value,
        unloadingLocation: document.getElementById('unloadingLocation').value,
        loadingDate: document.getElementById('loadingDate').value,
        unloadingDate: document.getElementById('unloadingDate').value,
        materialType: document.getElementById('materialType').value,
        weight: parseFloat(document.getElementById('weight').value),
        amount: parseFloat(document.getElementById('amount').value),
        numberOfTrips: numberOfTrips,
        totalAmount: totalAmount,
        amountPaid: parseFloat(document.getElementById('amountPaid').value) || 0,
        notes: document.getElementById('tripNotes').value
    };

    // simple client-side validation to catch obvious mistakes before the network trip
    if (!data.truck) {
        showMessage('Please select a truck for the trip', 'error');
        return;
    }
        if (!data.customerName || data.customerName.trim().length < 2) {
            showMessage('Customer name must be at least 2 characters', 'error');
            return;
        }
        if (!data.loadingLocation || data.loadingLocation.trim().length < 2) {
        showMessage('Loading location must be at least 2 characters', 'error');
        return;
    }
    if (!data.unloadingLocation || data.unloadingLocation.trim().length < 2) {
        showMessage('Unloading location must be at least 2 characters', 'error');
        return;
    }
    if (!data.loadingDate) {
        showMessage('Please choose a loading date', 'error');
        return;
    }
    if (!data.unloadingDate) {
        showMessage('Please choose an unloading date', 'error');
        return;
    }
    if (!data.weight || isNaN(data.weight) || data.weight <= 0) {
        showMessage('Weight must be a positive number', 'error');
        return;
    }
    if (!data.amount || isNaN(data.amount) || data.amount <= 0) {
        showMessage('Amount per trip must be a positive number', 'error');
        return;
    }

    const method = tripId ? 'PUT' : 'POST';
    const url = tripId ? `${API_URL}/trips/${tripId}` : `${API_URL}/trips`;

    fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(async res => {
        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
            // show error message from server if available, otherwise generic
            const msg = body.message || 'Unable to save trip';
            showMessage(msg, 'error');
            throw new Error(msg);
        }
        return body;
    })
    .then(data => {
        showMessage('Trip saved successfully', 'success');
        closeModal('tripModal');
        loadTrips();
        loadDashboard();
        loadPendingTrips();
    })
    .catch(err => {
        // fetch errors are already reported above; no additional action needed
        console.error('Save trip failed:', err);
    });
}

function deleteTrip(tripId) {
    if (confirm('Are you sure you want to delete this trip?')) {
        fetch(`${API_URL}/trips/${tripId}`, { method: 'DELETE' })
            .then(async res => {
                const body = await res.json().catch(() => ({}));
                if (!res.ok) {
                    const msg = body.message || 'Failed to delete trip';
                    showMessage(msg, 'error');
                    throw new Error(msg);
                }
                return body;
            })
            .then(data => {
                showMessage('Trip deleted successfully', 'success');
                loadTrips();
                loadDashboard();
                loadPendingTrips();
            })
            .catch(err => {
                console.error('Error deleting trip:', err);
            });
    }
}

function loadTrips() {
    fetch(`${API_URL}/trips`)
        .then(res => res.json())
        .then(trips => {
            const tbody = document.getElementById('tripsTableBody');
            if (trips.length === 0) {
                tbody.innerHTML = '<tr><td colspan="13" style="text-align: center; color: #999;">No trips added</td></tr>';
                return;
            }

            tbody.innerHTML = trips.map(trip => `
                <tr>
                    <td><strong>${trip.tripId}</strong></td>
                    <td>${trip.truck.truckNumber}</td>
                    <td>${trip.customer ? trip.customer.name : '-'}</td>
                    <td>${trip.loadingLocation}</td>
                    <td>${trip.unloadingLocation}</td>
                    <td>${new Date(trip.loadingDate).toLocaleDateString()}</td>
                    <td>${trip.weight}</td>
                    <td>₹${trip.amount.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                    <td>₹${(trip.totalAmount || trip.amount).toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                    <td><span class="status-badge status-${trip.paymentStatus}">${trip.paymentStatus}</span></td>
                    <td><button class="btn-info" onclick="openPrintBill('${trip._id}')">Print</button></td>
                    <td><strong>₹${trip.pendingAmount.toLocaleString('en-IN', {minimumFractionDigits: 2})}</strong></td>
                    <td>
                        <button class="btn-secondary" onclick="editTrip('${trip._id}')">Edit</button>
                        ${trip.paymentStatus !== 'paid' ? `<button class="btn-success" onclick="openPaymentModal('${trip._id}', ${trip.pendingAmount})">Pay</button>` : ''}
                        <button class="btn-danger" onclick="deleteTrip('${trip._id}')">Delete</button>
                    </td>
                </tr>
            `).join('');
        })
        .catch(err => console.error('Error loading trips:', err));
}

function loadPendingTrips() {
    fetch(`${API_URL}/trips/pending/all`)
        .then(res => res.json())
        .then(trips => {
            const tbody = document.getElementById('pendingTableBody');
            if (trips.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: #999;">No pending dues</td></tr>';
                return;
            }

            tbody.innerHTML = trips.map(trip => `
                <tr>
                    <td><strong>${trip.tripId}</strong></td>
                    <td>${trip.truck.truckNumber}</td>
                    <td>${trip.customer ? trip.customer.name : '-'}</td>
                    <td>${trip.loadingLocation} → ${trip.unloadingLocation}</td>
                    <td>₹${(trip.totalAmount || trip.amount).toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                    <td>₹${trip.amountPaid.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                    <td><strong class="amount">₹${trip.pendingAmount.toLocaleString('en-IN', {minimumFractionDigits: 2})}</strong></td>
                    <td>
                        <button class="btn-success" onclick="openPaymentModal('${trip._id}', ${trip.pendingAmount})">Pay Now</button>
                    </td>
                </tr>
            `).join('');
        })
        .catch(err => console.error('Error loading pending trips:', err));
}

function openPaymentModal(tripId, pendingAmount) {
    document.getElementById('paymentTripId').value = tripId;
    document.getElementById('paymentAmount').max = pendingAmount;
    document.getElementById('paymentAmount').value = '';
    openModal('paymentModal');
}

function recordPayment(event) {
    event.preventDefault();
    const tripId = document.getElementById('paymentTripId').value;
    const paymentAmount = parseFloat(document.getElementById('paymentAmount').value);

    // first fetch current trip to calculate new amountPaid
    fetch(`${API_URL}/trips/${tripId}`)
        .then(res => {
            if (!res.ok) throw new Error('Failed to load trip');
            return res.json();
        })
        .then(trip => {
            const newAmountPaid = trip.amountPaid + paymentAmount;
            const data = { amountPaid: newAmountPaid };

            return fetch(`${API_URL}/trips/${tripId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
        })
        .then(async res => {
            const body = await res.json().catch(() => ({}));
            if (!res.ok) {
                const msg = body.message || 'Failed to update payment';
                showMessage(msg, 'error');
                throw new Error(msg);
            }
            return body;
        })
        .then(data => {
            showMessage('Payment recorded successfully', 'success');
            closeModal('paymentModal');
            loadTrips();
            loadPendingTrips();
            loadDashboard();
        })
        .catch(err => {
            console.error('Error recording payment:', err);
        });
}

// Print bill function
function openPrintBill(tripId) {
    fetch(`${API_URL}/trips/${tripId}`)
        .then(res => {
            if (!res.ok) throw new Error('Failed to load trip for printing');
            return res.json();
        })
        .then(trip => {
            const doc = `
                <html>
                <head>
                    <title>Trip Bill - ${trip.tripId}</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 20px; }
                        h1 { text-align: center; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        td, th { border: 1px solid #333; padding: 8px; }
                        .total { font-weight: bold; }
                    </style>
                </head>
                <body>
                    <h1>Trip Invoice</h1>
                    <p><strong>Trip ID:</strong> ${trip.tripId}</p>
                    <p><strong>Truck:</strong> ${trip.truck.truckNumber} (${trip.truck.truckName || ''})</p>
                    <p><strong>Customer:</strong> ${trip.customer ? trip.customer.name : '-'}<br>
                       ${trip.customer && trip.customer.contactNumber ? 'Phone: ' + trip.customer.contactNumber + '<br>' : ''}
                       ${trip.customer && trip.customer.address ? 'Address: ' + trip.customer.address : ''}</p>
                    <table>
                        <tr><th>Loading</th><td>${trip.loadingLocation}</td></tr>
                        <tr><th>Unloading</th><td>${trip.unloadingLocation}</td></tr>
                        <tr><th>Loading Date</th><td>${new Date(trip.loadingDate).toLocaleDateString()}</td></tr>
                        <tr><th>Unloading Date</th><td>${new Date(trip.unloadingDate).toLocaleDateString()}</td></tr>
                        <tr><th>Material</th><td>${trip.materialType || ''}</td></tr>
                        <tr><th>Weight (Tons)</th><td>${trip.weight}</td></tr>
                        <tr><th>Amount / Trip</th><td>₹${trip.amount.toLocaleString('en-IN', {minimumFractionDigits:2})}</td></tr>
                        <tr><th>Number of Trips</th><td>${trip.numberOfTrips || 1}</td></tr>
                        <tr class="total"><th>Total Amount</th><td>₹${(trip.totalAmount||trip.amount).toLocaleString('en-IN', {minimumFractionDigits:2})}</td></tr>
                        <tr><th>Amount Paid</th><td>₹${trip.amountPaid.toLocaleString('en-IN', {minimumFractionDigits:2})}</td></tr>
                        <tr><th>Pending Amount</th><td>₹${trip.pendingAmount.toLocaleString('en-IN', {minimumFractionDigits:2})}</td></tr>
                    </table>
                    ${trip.notes ? `<p><strong>Notes:</strong> ${trip.notes}</p>` : ''}
                    <script>window.print();</script>
                </body>
                </html>
            `;
            const printWindow = window.open('', '_blank');
            printWindow.document.write(doc);
            printWindow.document.close();
        })
        .catch(err => {
            console.error('Error preparing print view:', err);
            showMessage('Unable to load trip for printing', 'error');
        });
}

// Invoice Functions
let invoices = JSON.parse(localStorage.getItem('invoices')) || [];

function generateInvoiceNumber() {
    const count = invoices.length + 1;
    return `INV-${String(count).padStart(4, '0')}`;
}

function openCreateInvoiceModal() {
    document.getElementById('invoiceNumber').value = generateInvoiceNumber();
    document.getElementById('invoiceDate').valueAsDate = new Date();
    document.getElementById('invoiceForm').reset();
    document.getElementById('workItemsContainer').innerHTML = `
        <div class="work-item">
            <div class="work-item-row">
                <div class="form-group">
                    <label>Description *</label>
                    <input type="text" class="work-description" placeholder="e.g., Foundation Work" required>
                </div>
                <div class="form-group" style="max-width: 100px;">
                    <label>Quantity</label>
                    <input type="number" class="work-quantity" step="0.1" value="1" min="1" required>
                </div>
                <div class="form-group" style="max-width: 120px;">
                    <label>Rate (₹)</label>
                    <input type="number" class="work-rate" step="0.01" placeholder="0" required>
                </div>
                <div class="form-group" style="max-width: 120px;">
                    <label>Amount (₹)</label>
                    <input type="number" class="work-amount" step="0.01" readonly>
                </div>
                <button type="button" class="btn-danger" onclick="removeWorkItem(this)" style="align-self: flex-end;">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `;
    attachWorkItemListeners();
    openModal('invoiceModal');
}

function addWorkItem() {
    const container = document.getElementById('workItemsContainer');
    const item = document.createElement('div');
    item.className = 'work-item';
    item.innerHTML = `
        <div class="work-item-row">
            <div class="form-group">
                <label>Description *</label>
                <input type="text" class="work-description" placeholder="e.g., Foundation Work" required>
            </div>
            <div class="form-group" style="max-width: 100px;">
                <label>Quantity</label>
                <input type="number" class="work-quantity" step="0.1" value="1" min="1" required>
            </div>
            <div class="form-group" style="max-width: 120px;">
                <label>Rate (₹)</label>
                <input type="number" class="work-rate" step="0.01" placeholder="0" required>
            </div>
            <div class="form-group" style="max-width: 120px;">
                <label>Amount (₹)</label>
                <input type="number" class="work-amount" step="0.01" readonly>
            </div>
            <button type="button" class="btn-danger" onclick="removeWorkItem(this)" style="align-self: flex-end;">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    container.appendChild(item);
    attachWorkItemListeners();
}

function removeWorkItem(btn) {
    btn.closest('.work-item').remove();
    calculateInvoiceTotals();
}

function attachWorkItemListeners() {
    document.querySelectorAll('.work-item').forEach(item => {
        const qtyInput = item.querySelector('.work-quantity');
        const rateInput = item.querySelector('.work-rate');
        const amountInput = item.querySelector('.work-amount');
        const gstInput = document.getElementById('invoiceGST');
        const amountPaidInput = document.getElementById('invoiceAmountPaid');

        [qtyInput, rateInput].forEach(input => {
            input.addEventListener('input', () => {
                const qty = parseFloat(qtyInput.value) || 0;
                const rate = parseFloat(rateInput.value) || 0;
                amountInput.value = (qty * rate).toFixed(2);
                calculateInvoiceTotals();
            });
        });
    });

    document.getElementById('invoiceGST').addEventListener('input', () => calculateInvoiceTotals());
    document.getElementById('invoiceAmountPaid').addEventListener('input', () => calculateInvoiceTotals());
}

function calculateInvoiceTotals() {
    let subtotal = 0;
    document.querySelectorAll('.work-amount').forEach(input => {
        subtotal += parseFloat(input.value) || 0;
    });

    const gstPercent = parseFloat(document.getElementById('invoiceGST').value) || 0;
    const gstAmount = (subtotal * gstPercent) / 100;
    const total = subtotal + gstAmount;
    const amountPaid = parseFloat(document.getElementById('invoiceAmountPaid').value) || 0;
    const balance = total - amountPaid;

    document.getElementById('invoiceSubtotal').value = subtotal.toFixed(2);
    document.getElementById('invoiceGSTAmount').value = gstAmount.toFixed(2);
    document.getElementById('invoiceTotal').value = total.toFixed(2);
    document.getElementById('invoiceBalance').value = balance.toFixed(2);
}

function saveInvoice(event) {
    event.preventDefault();

    const workItems = [];
    document.querySelectorAll('.work-item').forEach(item => {
        const description = item.querySelector('.work-description').value;
        const quantity = parseFloat(item.querySelector('.work-quantity').value);
        const rate = parseFloat(item.querySelector('.work-rate').value);
        const amount = parseFloat(item.querySelector('.work-amount').value);

        if (description && quantity && rate) {
            workItems.push({ description, quantity, rate, amount });
        }
    });

    if (workItems.length === 0) {
        showMessage('Please add at least one work item', 'error');
        return;
    }

    const invoice = {
        id: generateInvoiceNumber(),
        invoiceNumber: document.getElementById('invoiceNumber').value,
        invoiceDate: document.getElementById('invoiceDate').value,
        dueDate: document.getElementById('invoiceDueDate').value,
        projectName: document.getElementById('invoiceProject').value,
        clientName: document.getElementById('invoiceClientName').value,
        clientPhone: document.getElementById('invoiceClientPhone').value,
        clientAddress: document.getElementById('invoiceClientAddress').value,
        workItems: workItems,
        subtotal: parseFloat(document.getElementById('invoiceSubtotal').value),
        gstPercent: parseFloat(document.getElementById('invoiceGST').value) || 0,
        gstAmount: parseFloat(document.getElementById('invoiceGSTAmount').value),
        total: parseFloat(document.getElementById('invoiceTotal').value),
        amountPaid: parseFloat(document.getElementById('invoiceAmountPaid').value) || 0,
        balance: parseFloat(document.getElementById('invoiceBalance').value),
        upi: document.getElementById('invoiceUPI').value,
        bankName: document.getElementById('invoiceBankName').value,
        accountNumber: document.getElementById('invoiceAccountNumber').value,
        ifsc: document.getElementById('invoiceIFSC').value,
        createdAt: new Date().toISOString()
    };

    invoices.push(invoice);
    localStorage.setItem('invoices', JSON.stringify(invoices));

    showMessage('Invoice created successfully', 'success');
    closeModal('invoiceModal');
    loadInvoices();
}

function loadInvoices() {
    const tbody = document.getElementById('invoicesTableBody');
    
    if (invoices.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: #999;">No invoices created</td></tr>';
        return;
    }

    tbody.innerHTML = invoices.map(inv => `
        <tr>
            <td><strong>${inv.invoiceNumber}</strong></td>
            <td>${inv.clientName}</td>
            <td>${inv.projectName}</td>
            <td>${new Date(inv.invoiceDate).toLocaleDateString()}</td>
            <td>₹${inv.total.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
            <td>₹${inv.amountPaid.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
            <td><strong>₹${inv.balance.toLocaleString('en-IN', {minimumFractionDigits: 2})}</strong></td>
            <td>
                <button class="btn-info" onclick="viewInvoice('${inv.invoiceNumber}')">View</button>
                <button class="btn-danger" onclick="deleteInvoice('${inv.invoiceNumber}')">Delete</button>
            </td>
        </tr>
    `).join('');
}

function viewInvoice(invoiceNumber) {
    const invoice = invoices.find(inv => inv.invoiceNumber === invoiceNumber);
    if (!invoice) return;

    const workItemsHTML = invoice.workItems.map(item => `
        <tr>
            <td>${item.description}</td>
            <td>${item.quantity}</td>
            <td>₹${item.rate.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
            <td>₹${item.amount.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
        </tr>
    `).join('');

    const paymentMethods = [];
    if (invoice.upi) paymentMethods.push(`<p><strong>UPI:</strong> ${invoice.upi}</p>`);
    if (invoice.bankName) paymentMethods.push(`
        <p><strong>Bank Details:</strong></p>
        <p>Bank: ${invoice.bankName}<br>
           Account: ${invoice.accountNumber}<br>
           IFSC: ${invoice.ifsc}</p>
    `);

    const invoiceContent = `
        <div id="printableInvoice" class="invoice-document">
            <div class="invoice-header-section">
                <div class="company-logo">
                    <i class="fas fa-building"></i>
                </div>
                <div class="company-info">
                    <h1>BLP CONSTRUCTIONS</h1>
                    <p>Chhattisgarh, India</p>
                    <p>Phone: +91-9993643235</p>
                    <p>Email: blpconstructions@email.com</p>
                </div>
                <div class="invoice-title">
                    <h2>INVOICE</h2>
                    <p class="invoice-number"># ${invoice.invoiceNumber}</p>
                </div>
            </div>

            <div class="invoice-details">
                <div class="detail-section">
                    <h3>Bill To</h3>
                    <p><strong>${invoice.clientName}</strong></p>
                    <p>${invoice.clientAddress || 'Address not provided'}</p>
                    <p>Phone: ${invoice.clientPhone || 'N/A'}</p>
                </div>
                <div class="detail-section">
                    <p><strong>Invoice Date:</strong> ${new Date(invoice.invoiceDate).toLocaleDateString()}</p>
                    <p><strong>Due Date:</strong> ${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A'}</p>
                    <p><strong>Project:</strong> ${invoice.projectName}</p>
                </div>
            </div>

            <table class="invoice-table">
                <thead>
                    <tr>
                        <th>Description</th>
                        <th style="text-align: center;">Quantity</th>
                        <th style="text-align: right;">Rate (₹)</th>
                        <th style="text-align: right;">Amount (₹)</th>
                    </tr>
                </thead>
                <tbody>
                    ${workItemsHTML}
                </tbody>
            </table>

            <div class="invoice-summary">
                <div class="summary-left"></div>
                <div class="summary-right">
                    <div class="summary-row">
                        <span>Subtotal:</span>
                        <span>₹${invoice.subtotal.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                    </div>
                    ${invoice.gstPercent > 0 ? `
                        <div class="summary-row">
                            <span>GST (${invoice.gstPercent}%):</span>
                            <span>₹${invoice.gstAmount.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                        </div>
                    ` : ''}
                    <div class="summary-row total">
                        <span>Total Amount:</span>
                        <span>₹${invoice.total.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                    </div>
                    <div class="summary-row">
                        <span>Amount Paid:</span>
                        <span>₹${invoice.amountPaid.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                    </div>
                    <div class="summary-row balance">
                        <span>Balance Due:</span>
                        <span>₹${invoice.balance.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                    </div>
                </div>
            </div>

            ${paymentMethods.length > 0 ? `
                <div class="payment-methods-section">
                    <h3>Payment Methods</h3>
                    ${paymentMethods.join('')}
                </div>
            ` : ''}

            <div class="invoice-footer">
                <p>Thank you for your business!</p>
                <p style="font-size: 12px; margin-top: 10px; color: #666;">This is a computer-generated invoice. No signature required.</p>
            </div>
        </div>
    `;

    document.getElementById('invoiceContent').innerHTML = invoiceContent;
    openModal('invoiceViewModal');
}

function printInvoice() {
    const printWindow = window.open('', '_blank');
    const invoiceContent = document.getElementById('printableInvoice').innerHTML;
    
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Invoice</title>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { font-family: Arial, sans-serif; padding: 20px; background: white; }
                .invoice-document { max-width: 850px; margin: 0 auto; }
                .invoice-header-section { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
                .company-logo { font-size: 48px; color: #FF6B35; }
                .company-info h1 { font-size: 24px; margin-bottom: 5px; color: #333; }
                .company-info p { font-size: 12px; color: #666; }
                .invoice-title { text-align: right; }
                .invoice-title h2 { font-size: 28px; color: #004E89; margin-bottom: 5px; }
                .invoice-title .invoice-number { font-size: 14px; font-weight: bold; }
                .invoice-details { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 30px; }
                .detail-section h3 { font-size: 14px; font-weight: bold; margin-bottom: 10px; }
                .detail-section p { font-size: 12px; line-height: 1.6; color: #333; }
                .invoice-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                .invoice-table th { background: #f5f5f5; border: 1px solid #ddd; padding: 10px; text-align: left; font-weight: bold; font-size: 13px; }
                .invoice-table td { border: 1px solid #ddd; padding: 10px; font-size: 12px; }
                .invoice-summary { display: grid; grid-template-columns: 1.5fr 1fr; gap: 20px; margin-bottom: 30px; }
                .summary-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; font-size: 12px; }
                .summary-row.total { font-weight: bold; border-bottom: 2px solid #333; padding: 10px 0; }
                .summary-row.balance { color: #FF6B35; font-weight: bold; }
                .payment-methods-section { margin-bottom: 30px; padding: 15px; background: #f9f9f9; border-radius: 8px; }
                .payment-methods-section h3 { font-size: 14px; font-weight: bold; margin-bottom: 10px; }
                .payment-methods-section p { font-size: 12px; margin-bottom: 5px; }
                .invoice-footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; }
                .invoice-footer p { font-size: 12px; color: #666; }
                @media print { body { padding: 0; } }
            </style>
        </head>
        <body>
            ${invoiceContent}
            <script>window.print();</script>
        </body>
        </html>
    `);
    printWindow.document.close();
}

function deleteInvoice(invoiceNumber) {
    if (confirm('Are you sure you want to delete this invoice?')) {
        invoices = invoices.filter(inv => inv.invoiceNumber !== invoiceNumber);
        localStorage.setItem('invoices', JSON.stringify(invoices));
        showMessage('Invoice deleted successfully', 'success');
        closeModal('invoiceViewModal');
        loadInvoices();
    }
}

// Dashboard
function loadDashboard() {
    fetch(`${API_URL}/trips/stats/dashboard`)
        .then(res => res.json())
        .then(stats => {
            document.getElementById('totalTrips').textContent = stats.totalTrips;
            document.getElementById('totalEarnings').textContent = '₹' + stats.totalEarnings.toLocaleString('en-IN', {minimumFractionDigits: 2});
            document.getElementById('totalPending').textContent = '₹' + stats.totalPending.toLocaleString('en-IN', {minimumFractionDigits: 2});
            document.getElementById('paidTrips').textContent = stats.paidTrips;
        })
        .catch(err => console.error('Error loading dashboard stats:', err));

    // Load recent trips
    fetch(`${API_URL}/trips`)
        .then(res => res.json())
        .then(trips => {
            const recentTrips = trips.slice(0, 5); // Show last 5 trips
            const tbody = document.getElementById('recentTripsBody');
            
            if (recentTrips.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: #999;">No trips yet</td></tr>';
                return;
            }

            tbody.innerHTML = recentTrips.map(trip => `
                <tr>
                    <td><strong>${trip.tripId}</strong></td>
                    <td>${trip.truck.truckNumber}</td>
                    <td>${trip.loadingLocation} → ${trip.unloadingLocation}</td>
                    <td>${trip.weight} Tons</td>
                    <td>₹${trip.amount.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                    <td><span class="status-badge status-${trip.paymentStatus}">${trip.paymentStatus}</span></td>
                    <td>₹${trip.pendingAmount.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                </tr>
            `).join('');
        })
        .catch(err => console.error('Error loading recent trips:', err));
}

// Message Function
function showMessage(message, type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    document.body.insertBefore(messageDiv, document.body.firstChild);
    
    setTimeout(() => {
        messageDiv.remove();
    }, 3000);
}

// Initial Load
document.addEventListener('DOMContentLoaded', () => {
    // Setup navigation event listeners
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const page = this.getAttribute('data-page');
            navigateTo(page);
        });
    });
});
