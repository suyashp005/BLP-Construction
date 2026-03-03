// ==================== LOCALSTORAGE INITIALIZATION ====================
const STORAGE_KEYS = {
    TRUCKS: 'blp_trucks',
    TRIPS: 'blp_trips'
};

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

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
    const trucks = JSON.parse(localStorage.getItem(STORAGE_KEYS.TRUCKS) || '[]');
    const truck = trucks.find(t => t._id === truckId);
    
    if (truck) {
        document.getElementById('truckId').value = truck._id;
        document.getElementById('truckNumber').value = truck.truckNumber;
        document.getElementById('truckName').value = truck.truckName || '';
        document.getElementById('truckCapacity').value = truck.capacity || '';
        document.getElementById('truckStatus').value = truck.status || 'active';
        document.getElementById('truckModalTitle').textContent = 'Edit Truck';
        openModal('truckModal');
    } else {
        showMessage('Error loading truck', 'error');
    }
}

function saveTruck(event) {
    if (event && typeof event.preventDefault === 'function') event.preventDefault();
    const truckId = document.getElementById('truckId').value;
    const data = {
        _id: truckId || generateId(),
        truckNumber: document.getElementById('truckNumber').value,
        truckName: document.getElementById('truckName').value,
        capacity: parseFloat(document.getElementById('truckCapacity').value) || 0,
        status: document.getElementById('truckStatus').value,
        owner: 'SWAPNIL PANDEY'
    };

    // Get existing trucks
    let trucks = JSON.parse(localStorage.getItem(STORAGE_KEYS.TRUCKS) || '[]');
    
    if (truckId) {
        // Update existing truck
        trucks = trucks.map(t => t._id === truckId ? data : t);
    } else {
        // Add new truck
        trucks.push(data);
    }
    
    // Save to localStorage
    localStorage.setItem(STORAGE_KEYS.TRUCKS, JSON.stringify(trucks));
    
    showMessage('Truck saved successfully', 'success');
    closeModal('truckModal');
    loadTrucks();
    loadTrips(); // Reload trips to update truck names
}

function deleteTruck(truckId) {
    if (confirm('Are you sure you want to delete this truck?')) {
        let trucks = JSON.parse(localStorage.getItem(STORAGE_KEYS.TRUCKS) || '[]');
        trucks = trucks.filter(t => t._id !== truckId);
        localStorage.setItem(STORAGE_KEYS.TRUCKS, JSON.stringify(trucks));
        showMessage('Truck deleted successfully', 'success');
        loadTrucks();
    }
}

function loadTrucks() {
    const trucks = JSON.parse(localStorage.getItem(STORAGE_KEYS.TRUCKS) || '[]');
    const tbody = document.getElementById('trucksTableBody');
    
    if (trucks.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #999;">No trucks added</td></tr>';
    } else {
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
    }

    // Load truck options for trip form
    const select = document.getElementById('tripTruck');
    select.innerHTML = '<option value="">Select a truck</option>' + 
        trucks.map(truck => `<option value="${truck._id}">${truck.truckNumber} - ${truck.truckName || 'N/A'}</option>`).join('');
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
    const trips = JSON.parse(localStorage.getItem(STORAGE_KEYS.TRIPS) || '[]');
    const trip = trips.find(t => t._id === tripId);
    
    if (trip) {
        document.getElementById('tripId').value = trip._id;
        document.getElementById('tripTruck').value = trip.truck._id;
        document.getElementById('customerName').value = trip.customer ? trip.customer.name : '';
        document.getElementById('customerPhone').value = trip.customer ? (trip.customer.contactNumber || '') : '';
        document.getElementById('customerAddress').value = trip.customer ? (trip.customer.address || '') : '';
        document.getElementById('loadingLocation').value = trip.loadingLocation;
        document.getElementById('unloadingLocation').value = trip.unloadingLocation;
        document.getElementById('loadingDate').value = trip.loadingDate;
        document.getElementById('unloadingDate').value = trip.unloadingDate;
        document.getElementById('materialType').value = trip.materialType || '';
        document.getElementById('weight').value = trip.weight;
        document.getElementById('amount').value = trip.amount;
        document.getElementById('numberOfTrips').value = trip.numberOfTrips || '';
        document.getElementById('totalAmount').value = trip.totalAmount || trip.amount || '';
        document.getElementById('amountPaid').value = trip.amountPaid;
        document.getElementById('tripNotes').value = trip.notes || '';
        document.getElementById('tripModalTitle').textContent = 'Edit Trip';
        updateTotalAmountField();
        openModal('tripModal');
    } else {
        showMessage('Error loading trip', 'error');
    }
}

function saveTrip(event) {
    if (event && typeof event.preventDefault === 'function') event.preventDefault();
    const tripId = document.getElementById('tripId').value;
    const numberOfTrips = parseInt(document.getElementById('numberOfTrips').value) || 1;
    const totalAmount = parseFloat(document.getElementById('totalAmount').value) || parseFloat(document.getElementById('amount').value);

    // Get truck data for reference
    const trucks = JSON.parse(localStorage.getItem(STORAGE_KEYS.TRUCKS) || '[]');
    const truckId = document.getElementById('tripTruck').value;
    const truck = trucks.find(t => t._id === truckId);

    // gather values
    const data = {
        _id: tripId || generateId(),
        tripId: tripId ? undefined : 'TRIP-' + Date.now().toString(36).toUpperCase().substr(-6),
        truck: { _id: truckId, truckNumber: truck ? truck.truckNumber : '' },
        customer: {
            name: document.getElementById('customerName').value,
            contactNumber: document.getElementById('customerPhone').value,
            address: document.getElementById('customerAddress').value
        },
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

    // simple client-side validation
    if (!data.truck._id) {
        showMessage('Please select a truck for the trip', 'error');
        return;
    }
    if (!data.customer.name || data.customer.name.trim().length < 2) {
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

    // Calculate pendingAmount
    data.paymentStatus = data.amountPaid >= data.totalAmount ? 'paid' : 'pending';
    data.pendingAmount = Math.max(0, data.totalAmount - data.amountPaid);

    // Get existing trips
    let trips = JSON.parse(localStorage.getItem(STORAGE_KEYS.TRIPS) || '[]');
    
    if (tripId) {
        // Update existing trip
        trips = trips.map(t => t._id === tripId ? { ...t, ...data } : t);
    } else {
        // Add new trip
        trips.push(data);
    }
    
    // Save to localStorage
    localStorage.setItem(STORAGE_KEYS.TRIPS, JSON.stringify(trips));
    
    showMessage('Trip saved successfully', 'success');
    closeModal('tripModal');
    loadTrips();
    loadDashboard();
    loadPendingTrips();
}

function deleteTrip(tripId) {
    if (confirm('Are you sure you want to delete this trip?')) {
        let trips = JSON.parse(localStorage.getItem(STORAGE_KEYS.TRIPS) || '[]');
        trips = trips.filter(t => t._id !== tripId);
        localStorage.setItem(STORAGE_KEYS.TRIPS, JSON.stringify(trips));
        showMessage('Trip deleted successfully', 'success');
        loadTrips();
        loadDashboard();
        loadPendingTrips();
    }
}

function loadTrips() {
    const trips = JSON.parse(localStorage.getItem(STORAGE_KEYS.TRIPS) || '[]');
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
}

function loadPendingTrips() {
    const trips = JSON.parse(localStorage.getItem(STORAGE_KEYS.TRIPS) || '[]');
    const pending = trips.filter(t => t.pendingAmount && t.pendingAmount > 0);
    const tbody = document.getElementById('pendingTableBody');
    if (pending.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: #999;">No pending dues</td></tr>';
        return;
    }

    tbody.innerHTML = pending.map(trip => `
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
}

function openPaymentModal(tripId, pendingAmount) {
    document.getElementById('paymentTripId').value = tripId;
    document.getElementById('paymentAmount').max = pendingAmount;
    document.getElementById('paymentAmount').value = '';
    openModal('paymentModal');
}

function recordPayment(event) {
    if (event && typeof event.preventDefault === 'function') event.preventDefault();
    const tripId = document.getElementById('paymentTripId').value;
    const paymentAmount = parseFloat(document.getElementById('paymentAmount').value);

    let trips = JSON.parse(localStorage.getItem(STORAGE_KEYS.TRIPS) || '[]');
    const idx = trips.findIndex(t => t._id === tripId);
    if (idx === -1) {
        showMessage('Trip not found', 'error');
        return;
    }
    trips[idx].amountPaid = (trips[idx].amountPaid || 0) + paymentAmount;
    trips[idx].pendingAmount = Math.max(0, (trips[idx].totalAmount || trips[idx].amount) - trips[idx].amountPaid);
    trips[idx].paymentStatus = trips[idx].pendingAmount <= 0 ? 'paid' : 'pending';
   
    localStorage.setItem(STORAGE_KEYS.TRIPS, JSON.stringify(trips));

    showMessage('Payment recorded successfully', 'success');
    closeModal('paymentModal');
    loadTrips();
    loadPendingTrips();
    loadDashboard();
}

// Print bill function
function openPrintBill(tripId) {
    // Try to load trip from localStorage first (fallback when no API available)
    const trips = JSON.parse(localStorage.getItem(STORAGE_KEYS.TRIPS) || '[]');
    const trip = trips.find(t => t._id === tripId);

    const renderPrintDoc = (trip) => {
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
    };

    if (trip) {
        renderPrintDoc(trip);
        return;
    }

    // Fallback to API if trips not found in localStorage and API_URL is provided
    if (typeof API_URL !== 'undefined' && API_URL) {
        fetch(`${API_URL}/trips/${tripId}`)
            .then(res => {
                if (!res.ok) throw new Error('Failed to load trip for printing');
                return res.json();
            })
            .then(remoteTrip => renderPrintDoc(remoteTrip))
            .catch(err => {
                console.error('Error preparing print view:', err);
                showMessage('Unable to load trip for printing', 'error');
            });
    } else {
        showMessage('Unable to load trip for printing', 'error');
    }
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
    // Compute dashboard stats from localStorage to support offline/local mode
    const trips = JSON.parse(localStorage.getItem(STORAGE_KEYS.TRIPS) || '[]');
    const totalTrips = trips.length;
    const totalEarnings = trips.reduce((s, t) => s + (parseFloat(t.totalAmount) || parseFloat(t.amount) || 0), 0);
    const totalPending = trips.reduce((s, t) => s + (parseFloat(t.pendingAmount) || 0), 0);
    const paidTrips = trips.filter(t => t.paymentStatus === 'paid').length;

    document.getElementById('totalTrips').textContent = totalTrips;
    document.getElementById('totalEarnings').textContent = '₹' + totalEarnings.toLocaleString('en-IN', {minimumFractionDigits: 2});
    document.getElementById('totalPending').textContent = '₹' + totalPending.toLocaleString('en-IN', {minimumFractionDigits: 2});
    document.getElementById('paidTrips').textContent = paidTrips;

    // Load recent trips (most recent by created order in array)
    const recentTrips = trips.slice(-5).reverse();
    const tbody = document.getElementById('recentTripsBody');
    if (recentTrips.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: #999;">No trips yet</td></tr>';
    } else {
        tbody.innerHTML = recentTrips.map(trip => `
            <tr>
                <td><strong>${trip.tripId}</strong></td>
                <td>${trip.truck.truckNumber}</td>
                <td>${trip.loadingLocation} → ${trip.unloadingLocation}</td>
                <td>${trip.weight} Tons</td>
                <td>₹${(parseFloat(trip.amount)||0).toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                <td><span class="status-badge status-${trip.paymentStatus}">${trip.paymentStatus}</span></td>
                <td>₹${(parseFloat(trip.pendingAmount)||0).toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
            </tr>
        `).join('');
    }
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
    // Ensure forms have submit listeners and expose handlers to global scope
    const truckForm = document.getElementById('truckForm');
    if (truckForm) truckForm.addEventListener('submit', saveTruck);
    const tripForm = document.getElementById('tripForm');
    if (tripForm) tripForm.addEventListener('submit', saveTrip);
    // Expose to global in case inline onsubmit references fail
    window.saveTruck = saveTruck;
    window.saveTrip = saveTrip;
});

// Ensure handlers are available on `window` even if DOMContentLoaded didn't run
if (typeof window !== 'undefined') {
    try {
        window.saveTruck = window.saveTruck || saveTruck;
        window.saveTrip = window.saveTrip || saveTrip;
        window.recordPayment = window.recordPayment || recordPayment;
    } catch (e) {
        // ignore if functions not defined yet
    }
}
