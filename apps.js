/**
 * NJTC PROGRESS JOURNAL - ULTIMATE PREMIUM EDITION
 * 100% Working - All Features Functional
 * Built by Impact Solutions Group LLC
 */

// ==========================================
// CONFIGURATION - YOUR ACTUAL URLS
// ==========================================

const CONFIG = {
    API_BASE: 'https://script.google.com/macros/s/AKfycbyghqCTIYbtX32T5ZDotmkrEoAkBh5WK54DfSzXJ4p7ALZxUlInXcBwqYbW5RX3Tk-z/exec',
    SHARED_KEY: 'NJTC_INTERNAL_2025'
};

// ==========================================
// STATE MANAGEMENT
// ==========================================

const state = {
    currentTab: 'new-entry',
    selectedRating: null,
    imageFile: null,
    imageBase64: null,
    allEntries: []
};

// ==========================================
// INITIALIZATION
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('🎯 NJTC Progress Journal Loading...');
    
    initializeTabs();
    initializeForm();
    initializeRatingButtons();
    initializeImageUpload();
    initializePinSearch();
    initializeScholarSearch();
    loadSavedData();
    
    console.log('✅ System Ready!');
});

// ==========================================
// TAB NAVIGATION - FIX: MAKE TABS CLICKABLE
// ==========================================

function initializeTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const tabName = this.getAttribute('data-tab');
            
            console.log('Tab clicked:', tabName);

            // Remove all active classes
            tabButtons.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            // Add active to clicked tab
            this.classList.add('active');
            const targetContent = document.getElementById(tabName);
            if (targetContent) {
                targetContent.classList.add('active');
            }

            state.currentTab = tabName;
        });
    });
}

// ==========================================
// FORM INITIALIZATION
// ==========================================

function initializeForm() {
    const form = document.getElementById('entry-form');
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!state.selectedRating) {
            showToast('⚠️ Please select a performance rating', 'error');
            return;
        }

        await submitEntry();
    });
}

// ==========================================
// RATING BUTTONS - FIX: STAY COLORED ON SELECT
// ==========================================

function initializeRatingButtons() {
    const ratingButtons = document.querySelectorAll('.rating-btn');

    ratingButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            console.log('Rating clicked:', this.getAttribute('data-rating'));
            
            // Remove selected from all
            ratingButtons.forEach(b => b.classList.remove('selected'));
            
            // Add selected to this button
            this.classList.add('selected');
            
            // Update state
            state.selectedRating = this.getAttribute('data-rating');
            document.getElementById('performanceRating').value = state.selectedRating;
            
            console.log('Rating set to:', state.selectedRating);
        });
    });
}

// ==========================================
// IMAGE UPLOAD - FIX: SHOW PREVIEW
// ==========================================

function initializeImageUpload() {
    const uploadBtn = document.getElementById('uploadBtn');
    const imageInput = document.getElementById('imageUpload');

    uploadBtn.addEventListener('click', function(e) {
        e.preventDefault();
        imageInput.click();
    });

    imageInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;

        console.log('Image selected:', file.name);

        if (!file.type.match(/image\/(jpeg|jpg|png)/)) {
            showToast('⚠️ Please select JPG or PNG', 'error');
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            showToast('⚠️ Image must be under 10MB', 'error');
            return;
        }

        state.imageFile = file;

        const reader = new FileReader();
        reader.onload = function(event) {
            state.imageBase64 = event.target.result;
            displayImagePreview(event.target.result);
        };
        reader.readAsDataURL(file);
    });
}

function displayImagePreview(dataUrl) {
    const preview = document.getElementById('imagePreview');
    preview.innerHTML = `
        <div class="preview-container">
            <img src="${dataUrl}" alt="Preview" class="preview-img">
            <button type="button" class="remove-img" onclick="removeImage()">×</button>
        </div>
    `;
    preview.style.display = 'block';
}

window.removeImage = function() {
    state.imageFile = null;
    state.imageBase64 = null;
    document.getElementById('imagePreview').innerHTML = '';
    document.getElementById('imagePreview').style.display = 'none';
    document.getElementById('imageUpload').value = '';
    console.log('Image removed');
};

// ==========================================
// FORM SUBMISSION
// ==========================================

async function submitEntry() {
    const submitBtn = document.getElementById('submitBtn');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoader = submitBtn.querySelector('.btn-loader');

    try {
        submitBtn.disabled = true;
        btnText.style.display = 'none';
        btnLoader.style.display = 'inline';

        const data = {
            key: CONFIG.SHARED_KEY,
            site: document.getElementById('site').value,
            staffRole: document.getElementById('staffRole').value,
            staffPin: document.getElementById('staffPin').value,
            scholarId: document.getElementById('scholarId').value,
            skillArea: document.getElementById('skillArea').value,
            specificSkillTarget: document.getElementById('specificSkillTarget').value || '',
            evidenceType: document.getElementById('evidenceType').value,
            performanceRating: state.selectedRating,
            optionalNote: document.getElementById('optionalNote').value || ''
        };

        if (state.imageBase64) {
            data.imageBase64 = state.imageBase64;
            data.imageFilename = state.imageFile.name;
            data.imageMimeType = state.imageFile.type;
        }

        console.log('Submitting:', data);
        saveFormData(data);

        const response = await fetch(CONFIG.API_BASE, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        console.log('Result:', result);

        if (result.status === 'success') {
            showToast('✅ Entry saved successfully!', 'success');
            resetForm();
            
            setTimeout(() => {
                if (confirm('Entry saved!\n\nCreate another entry?')) {
                    // Stay here
                } else {
                    document.querySelector('[data-tab="pin-search"]').click();
                }
            }, 500);
        } else {
            throw new Error(result.error || 'Failed to save');
        }

    } catch (error) {
        console.error('Error:', error);
        showToast('❌ Error: ' + error.message, 'error');
    } finally {
        submitBtn.disabled = false;
        btnText.style.display = 'inline';
        btnLoader.style.display = 'none';
    }
}

function resetForm() {
    document.getElementById('entry-form').reset();
    document.querySelectorAll('.rating-btn').forEach(b => b.classList.remove('selected'));
    state.selectedRating = null;
    document.getElementById('performanceRating').value = '';
    removeImage();
    
    const saved = getSavedFormData();
    if (saved.site) document.getElementById('site').value = saved.site;
    if (saved.staffRole) document.getElementById('staffRole').value = saved.staffRole;
    if (saved.staffPin) document.getElementById('staffPin').value = saved.staffPin;
}

// ==========================================
// PIN SEARCH - DUAL ROLE SEARCHES BY PIN
// ==========================================

function initializePinSearch() {
    const searchBtn = document.getElementById('pinSearchBtn');
    const pinInput = document.getElementById('searchPin');

    searchBtn.addEventListener('click', function() {
        const pin = pinInput.value.trim();
        if (pin) {
            searchByPin(pin);
        } else {
            showToast('⚠️ Enter a PIN to search', 'error');
        }
    });

    pinInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            searchBtn.click();
        }
    });
}

async function searchByPin(pin) {
    const resultsDiv = document.getElementById('pinResults');
    
    resultsDiv.innerHTML = '<div class="loading">🔍 Searching...</div>';

    try {
        const saved = getSavedFormData();
        const site = saved.site || document.getElementById('site').value;

        if (!site) {
            showToast('⚠️ Please submit an entry first to set your site', 'error');
            return;
        }

        const url = `${CONFIG.API_BASE}?key=${encodeURIComponent(CONFIG.SHARED_KEY)}&path=history&site=${encodeURIComponent(site)}&staffPin=${encodeURIComponent(pin)}`;
        
        console.log('Searching PIN:', pin, 'at site:', site);

        const response = await fetch(url);
        const result = await response.json();

        console.log('PIN search result:', result);

        if (result.error) {
            throw new Error(result.error);
        }

        state.allEntries = result.entries || [];

        if (state.allEntries.length > 0) {
            displayPinResults(state.allEntries, pin);
        } else {
            resultsDiv.innerHTML = `
                <div class="empty-state">
                    <span class="empty-icon">🔍</span>
                    <p><strong>No entries found for PIN: ${pin}</strong></p>
                </div>
            `;
        }

    } catch (error) {
        console.error('Error:', error);
        resultsDiv.innerHTML = `
            <div class="empty-state">
                <span class="empty-icon">⚠️</span>
                <p><strong>Error: ${error.message}</strong></p>
            </div>
        `;
    }
}

function displayPinResults(entries, pin) {
    const resultsDiv = document.getElementById('pinResults');
    
    const header = `
        <div class="results-header">
            <h3>📋 Found ${entries.length} ${entries.length === 1 ? 'entry' : 'entries'} for PIN: <span class="pin-badge">${pin}</span></h3>
            <button onclick="exportToCSV()" class="btn-export">📊 Export CSV</button>
        </div>
    `;
    
    const cards = entries.map((entry, i) => createEntryCard(entry, i)).join('');
    
    resultsDiv.innerHTML = header + cards;

    document.querySelectorAll('.entry-card').forEach(card => {
        card.addEventListener('click', function() {
            const details = this.querySelector('.entry-details');
            details.classList.toggle('expanded');
        });
    });
}

// ==========================================
// SCHOLAR SEARCH
// ==========================================

function initializeScholarSearch() {
    const searchBtn = document.getElementById('scholarSearchBtn');
    const scholarInput = document.getElementById('searchScholar');

    searchBtn.addEventListener('click', function() {
        const scholarId = scholarInput.value.trim();
        if (scholarId) {
            searchByScholar(scholarId);
        } else {
            showToast('⚠️ Enter a Scholar ID to search', 'error');
        }
    });

    scholarInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            searchBtn.click();
        }
    });
}

async function searchByScholar(scholarId) {
    const resultsDiv = document.getElementById('scholarResults');
    
    resultsDiv.innerHTML = '<div class="loading">🔍 Searching...</div>';

    try {
        const saved = getSavedFormData();
        const site = saved.site || document.getElementById('site').value;

        if (!site) {
            showToast('⚠️ Please submit an entry first to set your site', 'error');
            return;
        }

        const url = `${CONFIG.API_BASE}?key=${encodeURIComponent(CONFIG.SHARED_KEY)}&path=scholarHistory&site=${encodeURIComponent(site)}&scholarId=${encodeURIComponent(scholarId)}`;
        
        console.log('Searching scholar:', scholarId);

        const response = await fetch(url);
        const result = await response.json();

        console.log('Scholar search result:', result);

        if (result.error) {
            throw new Error(result.error);
        }

        const entries = result.entries || [];

        if (entries.length > 0) {
            displayScholarResults(entries, scholarId);
        } else {
            resultsDiv.innerHTML = `
                <div class="empty-state">
                    <span class="empty-icon">👤</span>
                    <p><strong>No entries found for Scholar: ${scholarId}</strong></p>
                </div>
            `;
        }

    } catch (error) {
        console.error('Error:', error);
        resultsDiv.innerHTML = `
            <div class="empty-state">
                <span class="empty-icon">⚠️</span>
                <p><strong>Error: ${error.message}</strong></p>
            </div>
        `;
    }
}

function displayScholarResults(entries, scholarId) {
    const resultsDiv = document.getElementById('scholarResults');
    
    const header = `
        <div class="results-header">
            <h3>👤 ${entries.length} ${entries.length === 1 ? 'entry' : 'entries'} for Scholar: <span class="scholar-badge">${scholarId}</span></h3>
        </div>
    `;
    
    const cards = entries.map((entry, i) => createEntryCard(entry, i)).join('');
    
    resultsDiv.innerHTML = header + cards;

    document.querySelectorAll('.entry-card').forEach(card => {
        card.addEventListener('click', function() {
            const details = this.querySelector('.entry-details');
            details.classList.toggle('expanded');
        });
    });
}

// ==========================================
// ENTRY CARD
// ==========================================

function createEntryCard(entry, index) {
    const date = new Date(entry.timestamp);
    const dateStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    const ratingClass = entry.performanceRating.toLowerCase().replace(/\s+/g, '-');

    return `
        <div class="entry-card">
            <div class="entry-header">
                <div>
                    <div class="entry-title">👤 ${entry.scholarId}</div>
                    <div class="entry-meta">📚 ${entry.skillArea}</div>
                    <div class="entry-meta">👨‍🏫 ${entry.staffRole} | 🔐 ${entry.staffPin}</div>
                    <span class="performance-badge ${ratingClass}">${entry.performanceRating}</span>
                </div>
                <div class="entry-date">🕐 ${dateStr}</div>
            </div>
            
            <div class="entry-details">
                ${entry.specificSkillTarget ? `
                    <div class="detail-row">
                        <strong>🎯 Target:</strong> ${entry.specificSkillTarget}
                    </div>
                ` : ''}
                
                <div class="detail-row">
                    <strong>📋 Evidence:</strong> ${entry.evidenceType}
                </div>
                
                ${entry.optionalNote ? `
                    <div class="detail-row">
                        <strong>💭 Notes:</strong> ${entry.optionalNote}
                    </div>
                ` : ''}
                
                ${entry.evidenceImageUrl ? `
                    <div class="detail-row">
                        <strong>📸 Image:</strong>
                        <a href="${entry.evidenceImageUrl}" target="_blank" class="image-link">
                            <img src="${entry.evidenceImageUrl}" alt="Evidence">
                        </a>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
}

// ==========================================
// EXPORT TO CSV
// ==========================================

window.exportToCSV = function() {
    if (!state.allEntries || state.allEntries.length === 0) {
        showToast('⚠️ No data to export', 'error');
        return;
    }

    const headers = ['Timestamp', 'Site', 'Role', 'PIN', 'Scholar', 'Skill', 'Target', 'Evidence', 'Rating', 'Notes', 'Image'];
    
    const rows = state.allEntries.map(e => [
        new Date(e.timestamp).toLocaleString(),
        e.site,
        e.staffRole,
        e.staffPin,
        e.scholarId,
        e.skillArea,
        e.specificSkillTarget || '',
        e.evidenceType,
        e.performanceRating,
        e.optionalNote || '',
        e.evidenceImageUrl || ''
    ]);

    const csv = [headers, ...rows].map(row => 
        row.map(cell => `"${cell}"`).join(',')
    ).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NJTC_Progress_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    
    showToast('✅ CSV exported!', 'success');
};

// ==========================================
// LOCAL STORAGE
// ==========================================

function saveFormData(data) {
    localStorage.setItem('njtc_site', data.site);
    localStorage.setItem('njtc_staffRole', data.staffRole);
    localStorage.setItem('njtc_staffPin', data.staffPin);
}

function getSavedFormData() {
    return {
        site: localStorage.getItem('njtc_site'),
        staffRole: localStorage.getItem('njtc_staffRole'),
        staffPin: localStorage.getItem('njtc_staffPin')
    };
}

function loadSavedData() {
    const saved = getSavedFormData();
    if (saved.site) document.getElementById('site').value = saved.site;
    if (saved.staffRole) document.getElementById('staffRole').value = saved.staffRole;
    if (saved.staffPin) document.getElementById('staffPin').value = saved.staffPin;
}

// ==========================================
// TOAST
// ==========================================

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    setTimeout(() => toast.classList.remove('show'), 3500);
}
