/**
 * NJTC PROGRESS JOURNAL - PREMIUM EDITION
 * Shared Tutor/Dual Role Workspace
 * PIN-Based Secure Access
 * Built by Impact Solutions Group LLC
 */

// ==========================================
// CONFIGURATION
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
    sharedHistoryData: [],
    currentFilter: 7,
    currentPin: null,
    currentSite: null
};

// ==========================================
// INITIALIZATION
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    initializeTabs();
    initializeForm();
    initializeImageUpload();
    initializeRatingButtons();
    initializeSharedHistory();
    initializeScholarLookup();
    initializeExport();
    loadSavedData();
    
    console.log('%c✓ NJTC Progress Journal PREMIUM', 'color: #003f87; font-weight: bold; font-size: 16px; text-shadow: 1px 1px 2px rgba(0,0,0,0.3);');
    console.log('%c🏆 Best-in-Class Enterprise System', 'color: #f0a500; font-size: 14px; font-weight: bold;');
    console.log('%c🔒 PIN-Based Secure Workspace', 'color: #10b981; font-size: 12px;');
});

// ==========================================
// TAB NAVIGATION
// ==========================================

function initializeTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;

            tabButtons.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            btn.classList.add('active');
            document.getElementById(tabName).classList.add('active');

            state.currentTab = tabName;

            // Load shared history when switching to that tab
            if (tabName === 'shared-history') {
                loadSharedHistory();
            }
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

function initializeRatingButtons() {
    const ratingButtons = document.querySelectorAll('.rating-btn');

    ratingButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            ratingButtons.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');

            state.selectedRating = btn.dataset.rating;
            document.getElementById('performanceRating').value = state.selectedRating;
            
            // Premium visual feedback
            btn.style.transform = 'scale(0.95)';
            setTimeout(() => {
                btn.style.transform = 'scale(1)';
            }, 150);
        });
    });
}

// ==========================================
// IMAGE UPLOAD
// ==========================================

function initializeImageUpload() {
    const uploadBtn = document.getElementById('uploadBtn');
    const imageUpload = document.getElementById('imageUpload');

    uploadBtn.addEventListener('click', (e) => {
        e.preventDefault();
        imageUpload.click();
    });

    imageUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.match(/image\/(jpeg|jpg|png)/)) {
            showToast('⚠️ Please select JPG or PNG only', 'error');
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            showToast('⚠️ Image must be under 10MB', 'error');
            return;
        }

        state.imageFile = file;

        const reader = new FileReader();
        reader.onload = (event) => {
            state.imageBase64 = event.target.result;
            displayImagePreview(event.target.result);
        };
        reader.readAsDataURL(file);
    });
}

function displayImagePreview(dataUrl) {
    const imagePreview = document.getElementById('imagePreview');
    imagePreview.innerHTML = `
        <div class="preview-container">
            <img src="${dataUrl}" alt="Evidence Preview" class="preview-img">
            <button type="button" class="remove-img" onclick="removeImage()" title="Remove image">×</button>
        </div>
    `;
}

function removeImage() {
    state.imageFile = null;
    state.imageBase64 = null;
    document.getElementById('imagePreview').innerHTML = '';
    document.getElementById('imageUpload').value = '';
}

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
            specificSkillTarget: document.getElementById('specificSkillTarget').value,
            evidenceType: document.getElementById('evidenceType').value,
            performanceRating: state.selectedRating,
            optionalNote: document.getElementById('optionalNote').value
        };

        if (state.imageBase64) {
            data.imageBase64 = state.imageBase64;
            data.imageFilename = state.imageFile.name;
            data.imageMimeType = state.imageFile.type;
        }

        saveFormData(data);

        const response = await fetch(CONFIG.API_BASE, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (result.status === 'success') {
            showToast('✓ Session entry saved successfully!', 'success');
            resetForm();
            
            setTimeout(() => {
                if (confirm('✓ Entry saved!\n\nCreate another journal entry?')) {
                    // Stay on form
                } else {
                    document.querySelector('[data-tab="shared-history"]').click();
                }
            }, 500);
        } else {
            throw new Error(result.error || 'Failed to save entry');
        }

    } catch (error) {
        console.error('Submission error:', error);
        showToast('❌ Error saving entry: ' + error.message, 'error');
    } finally {
        submitBtn.disabled = false;
        btnText.style.display = 'inline';
        btnLoader.style.display = 'none';
    }
}

function resetForm() {
    document.getElementById('entry-form').reset();
    document.querySelectorAll('.rating-btn').forEach(btn => btn.classList.remove('selected'));
    state.selectedRating = null;
    document.getElementById('performanceRating').value = '';
    removeImage();
    
    const saved = getSavedFormData();
    if (saved) {
        document.getElementById('site').value = saved.site || '';
        document.getElementById('staffRole').value = saved.staffRole || '';
        document.getElementById('staffPin').value = saved.staffPin || '';
    }
}

// ==========================================
// SHARED HISTORY (PIN-BASED ACCESS)
// ==========================================

function initializeSharedHistory() {
    // Loaded when tab is clicked
}

async function loadSharedHistory() {
    const historyContent = document.getElementById('historyContent');
    const saved = getSavedFormData();

    if (!saved || !saved.site || !saved.staffPin) {
        historyContent.innerHTML = `
            <div class="empty-state">
                <span class="empty-icon">🔐</span>
                <p><strong>Secure PIN Access Required</strong></p>
                <p>Submit an entry first to establish your Site + PIN credentials</p>
            </div>
        `;
        return;
    }

    state.currentPin = saved.staffPin;
    state.currentSite = saved.site;

    historyContent.innerHTML = `
        <div class="loading-skeleton">
            <div class="skeleton-card"></div>
            <div class="skeleton-card"></div>
            <div class="skeleton-card"></div>
        </div>
    `;

    try {
        const url = `${CONFIG.API_BASE}?key=${encodeURIComponent(CONFIG.SHARED_KEY)}&path=history&site=${encodeURIComponent(saved.site)}&staffPin=${encodeURIComponent(saved.staffPin)}`;
        
        const response = await fetch(url);
        const result = await response.json();

        if (result.error) {
            throw new Error(result.error);
        }

        state.sharedHistoryData = result.entries || [];

        if (state.sharedHistoryData.length > 0) {
            displaySharedHistory(state.sharedHistoryData);
        } else {
            historyContent.innerHTML = `
                <div class="empty-state">
                    <span class="empty-icon">📝</span>
                    <p><strong>No entries yet for PIN: ${saved.staffPin}</strong></p>
                    <p>Start by creating your first journal entry!</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading shared history:', error);
        historyContent.innerHTML = `
            <div class="empty-state">
                <span class="empty-icon">⚠️</span>
                <p><strong>Error loading history</strong></p>
                <p>${error.message}</p>
            </div>
        `;
    }
}

function displaySharedHistory(entries) {
    const historyContent = document.getElementById('historyContent');
    
    const headerHtml = `
        <div class="history-header">
            <div class="header-info">
                <span class="pin-badge">🔐 PIN: ${state.currentPin}</span>
                <span class="site-badge">📍 ${state.currentSite}</span>
                <span class="count-badge">📋 ${entries.length} ${entries.length === 1 ? 'Entry' : 'Entries'}</span>
            </div>
            <button onclick="exportHistory()" class="btn-export">
                <span>📊 Export to CSV</span>
            </button>
        </div>
    `;
    
    const html = entries.map((entry, index) => createEntryCard(entry, index, true)).join('');
    historyContent.innerHTML = headerHtml + html;

    document.querySelectorAll('.entry-card').forEach((card) => {
        card.addEventListener('click', (e) => {
            if (!e.target.classList.contains('btn-export')) {
                const details = card.querySelector('.entry-details');
                details.classList.toggle('expanded');
            }
        });
    });
}

// ==========================================
// SCHOLAR LOOKUP
// ==========================================

function initializeScholarLookup() {
    const lookupBtn = document.getElementById('lookupBtn');
    const lookupInput = document.getElementById('lookupScholarId');
    const filterChips = document.querySelectorAll('.filter-chip');

    lookupBtn.addEventListener('click', () => {
        const scholarId = lookupInput.value.trim();
        if (scholarId) {
            loadScholarHistory(scholarId);
        } else {
            showToast('⚠️ Please enter a scholar identifier', 'error');
        }
    });

    lookupInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            lookupBtn.click();
        }
    });

    filterChips.forEach(chip => {
        chip.addEventListener('click', () => {
            filterChips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            state.currentFilter = chip.dataset.days === 'all' ? 'all' : parseInt(chip.dataset.days);
            
            if (state.sharedHistoryData.length > 0) {
                displayScholarEntries(state.sharedHistoryData);
            }
        });
    });
}

async function loadScholarHistory(scholarId) {
    const scholarContent = document.getElementById('scholarContent');
    const saved = getSavedFormData();

    if (!saved || !saved.site) {
        showToast('⚠️ Please submit an entry first to set your site', 'error');
        return;
    }

    scholarContent.innerHTML = `
        <div class="loading-skeleton">
            <div class="skeleton-card"></div>
            <div class="skeleton-card"></div>
        </div>
    `;

    try {
        const url = `${CONFIG.API_BASE}?key=${encodeURIComponent(CONFIG.SHARED_KEY)}&path=scholarHistory&site=${encodeURIComponent(saved.site)}&scholarId=${encodeURIComponent(scholarId)}`;
        
        const response = await fetch(url);
        const result = await response.json();

        if (result.error) {
            throw new Error(result.error);
        }

        state.sharedHistoryData = result.entries || [];

        if (state.sharedHistoryData.length > 0) {
            displayScholarEntries(state.sharedHistoryData);
        } else {
            scholarContent.innerHTML = `
                <div class="empty-state">
                    <span class="empty-icon">🔍</span>
                    <p><strong>No entries found for scholar "${scholarId}"</strong></p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading scholar history:', error);
        scholarContent.innerHTML = `
            <div class="empty-state">
                <span class="empty-icon">⚠️</span>
                <p><strong>Error loading scholar history</strong></p>
                <p>${error.message}</p>
            </div>
        `;
    }
}

function displayScholarEntries(entries) {
    const scholarContent = document.getElementById('scholarContent');
    
    let filteredEntries = entries;
    if (state.currentFilter !== 'all') {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - state.currentFilter);
        
        filteredEntries = entries.filter(entry => {
            const entryDate = new Date(entry.timestamp);
            return entryDate >= cutoffDate;
        });
    }

    if (filteredEntries.length === 0) {
        scholarContent.innerHTML = `
            <div class="empty-state">
                <span class="empty-icon">📅</span>
                <p><strong>No entries in selected time period</strong></p>
            </div>
        `;
        return;
    }

    const html = filteredEntries.map((entry, index) => createEntryCard(entry, index, false)).join('');
    scholarContent.innerHTML = html;

    document.querySelectorAll('.entry-card').forEach((card) => {
        card.addEventListener('click', () => {
            const details = card.querySelector('.entry-details');
            details.classList.toggle('expanded');
        });
    });
}

// ==========================================
// ENTRY CARD CREATION
// ==========================================

function createEntryCard(entry, index, showStaffInfo) {
    const date = new Date(entry.timestamp);
    const formattedDate = formatDate(date);
    const ratingClass = entry.performanceRating.toLowerCase().replace(/\s+/g, '-');

    return `
        <div class="entry-card premium-card" data-index="${index}">
            <div class="entry-header">
                <div>
                    <div class="entry-title">👤 Scholar ${entry.scholarId}</div>
                    <div class="entry-meta">📚 ${entry.skillArea}</div>
                    ${showStaffInfo ? `<div class="entry-meta staff-info">👨‍🏫 ${entry.staffRole}${entry.staffPin ? ' | PIN: ' + entry.staffPin : ''}</div>` : ''}
                    <div class="performance-badge ${ratingClass}">
                        ${entry.performanceRating}
                    </div>
                </div>
                <div class="entry-meta timestamp">🕐 ${formattedDate}</div>
            </div>
            
            <div class="entry-details">
                ${entry.specificSkillTarget ? `
                    <div class="detail-row">
                        <div class="detail-label">🎯 Specific Target</div>
                        <div class="detail-value">${entry.specificSkillTarget}</div>
                    </div>
                ` : ''}
                
                <div class="detail-row">
                    <div class="detail-label">📋 Evidence Type</div>
                    <div class="detail-value">${entry.evidenceType}</div>
                </div>
                
                ${entry.optionalNote ? `
                    <div class="detail-row">
                        <div class="detail-label">💭 Session Notes</div>
                        <div class="detail-value">${entry.optionalNote}</div>
                    </div>
                ` : ''}
                
                ${!showStaffInfo && entry.staffRole ? `
                    <div class="detail-row">
                        <div class="detail-label">👨‍🏫 Submitted By</div>
                        <div class="detail-value">${entry.staffRole}</div>
                    </div>
                ` : ''}
                
                ${entry.evidenceImageUrl ? `
                    <div class="entry-image">
                        <div class="detail-label">📸 Evidence Artifact</div>
                        <a href="${entry.evidenceImageUrl}" target="_blank" rel="noopener noreferrer" class="image-link">
                            <img src="${entry.evidenceImageUrl}" alt="Evidence" loading="lazy">
                            <span class="view-badge">🔍 View Full Size</span>
                        </a>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
}

// ==========================================
// EXPORT FUNCTIONALITY
// ==========================================

function initializeExport() {
    // Export button initialized in displaySharedHistory
}

window.exportHistory = function() {
    if (!state.sharedHistoryData || state.sharedHistoryData.length === 0) {
        showToast('⚠️ No data to export', 'error');
        return;
    }

    const csv = convertToCSV(state.sharedHistoryData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    const timestamp = new Date().toISOString().split('T')[0];
    link.setAttribute('href', url);
    link.setAttribute('download', `NJTC_Progress_Journal_${state.currentPin}_${timestamp}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast('✓ Export completed successfully!', 'success');
};

function convertToCSV(data) {
    const headers = [
        'Timestamp',
        'Site',
        'Staff Role',
        'Staff PIN',
        'Scholar ID',
        'Skill Area',
        'Specific Target',
        'Evidence Type',
        'Performance Rating',
        'Notes',
        'Image URL'
    ];
    
    const rows = data.map(entry => [
        formatDateForExport(entry.timestamp),
        entry.site,
        entry.staffRole,
        entry.staffPin,
        entry.scholarId,
        entry.skillArea,
        entry.specificSkillTarget || '',
        entry.evidenceType,
        entry.performanceRating,
        entry.optionalNote || '',
        entry.evidenceImageUrl || ''
    ]);
    
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    return csvContent;
}

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
// TOAST NOTIFICATIONS
// ==========================================

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3500);
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

function formatDate(date) {
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        if (hours === 0) {
            const minutes = Math.floor(diff / (1000 * 60));
            return minutes === 0 ? 'Just now' : `${minutes}m ago`;
        }
        return `${hours}h ago`;
    } else if (days === 1) {
        return 'Yesterday';
    } else if (days < 7) {
        return `${days}d ago`;
    } else {
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        });
    }
}

function formatDateForExport(date) {
    return new Date(date).toLocaleString('en-US');
}

window.removeImage = removeImage;
