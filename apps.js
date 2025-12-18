/**
 * NJTC Progress Journal - Application Logic
 * 100% ALIGNED WITH BACKEND
 * Version: 1.0 Production
 */

// ==========================================
// CONFIGURATION
// ==========================================

const CONFIG = {
    API_BASE: 'https://script.google.com/macros/s/AKfycbwL5vkMmjGB4fjPBUyw6xD9OvB9CymjNPV5wIRXcSuEDBGWPKmKku0YIe43zA8mHZk3/exec',
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
    scholarHistoryData: [],
    currentFilter: 7
};

// ==========================================
// INITIALIZATION
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    initializeTabs();
    initializeForm();
    initializeImageUpload();
    initializeRatingButtons();
    initializeHistoryView();
    initializeScholarLookup();
    loadSavedData();
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

            // Update active states
            tabButtons.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            btn.classList.add('active');
            document.getElementById(tabName).classList.add('active');

            state.currentTab = tabName;

            // Load data when switching to history tabs
            if (tabName === 'my-history') {
                loadMyHistory();
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

        // Validate rating is selected
        if (!state.selectedRating) {
            showToast('Please select a performance rating', 'error');
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
            
            // Remove selected class from all buttons
            ratingButtons.forEach(b => b.classList.remove('selected'));

            // Add selected class to clicked button
            btn.classList.add('selected');

            // Update state and hidden input
            state.selectedRating = btn.dataset.rating;
            document.getElementById('performanceRating').value = state.selectedRating;
            
            // Visual feedback
            btn.style.transform = 'scale(0.95)';
            setTimeout(() => {
                btn.style.transform = 'scale(1)';
            }, 150);
            
            console.log('Rating selected:', state.selectedRating);
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

        // Validate file type
        if (!file.type.match(/image\/(jpeg|jpg|png)/)) {
            showToast('Please select a JPG or PNG image', 'error');
            return;
        }

        // Validate file size (10MB max)
        if (file.size > 10 * 1024 * 1024) {
            showToast('Image must be less than 10MB', 'error');
            return;
        }

        state.imageFile = file;

        // Convert to base64
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
            <img src="${dataUrl}" alt="Preview" class="preview-img">
            <button type="button" class="remove-img" onclick="removeImage()">×</button>
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
        // Disable submit button
        submitBtn.disabled = true;
        btnText.style.display = 'none';
        btnLoader.style.display = 'inline';

        // Gather form data - ALIGNED WITH BACKEND
        const data = {
            key: CONFIG.SHARED_KEY,  // Backend expects 'key' in data
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

        // Add image data if present
        if (state.imageBase64) {
            data.imageBase64 = state.imageBase64;
            data.imageFilename = state.imageFile.name;
            data.imageMimeType = state.imageFile.type;
        }

        console.log('Submitting entry:', data);

        // Save to localStorage
        saveFormData(data);

        // Submit to backend - NO key in URL, key is in POST body
        const response = await fetch(CONFIG.API_BASE, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        console.log('Submission result:', result);

        if (result.status === 'success') {
            showToast('✓ Journal entry saved successfully!', 'success');
            resetForm();
            
            // Ask if user wants to create another entry
            setTimeout(() => {
                if (confirm('Entry saved! Create another entry?')) {
                    // Form is already reset, just stay on this tab
                } else {
                    // Switch to history tab
                    document.querySelector('[data-tab="my-history"]').click();
                }
            }, 500);
        } else {
            throw new Error(result.error || 'Failed to save entry');
        }

    } catch (error) {
        console.error('Submission error:', error);
        showToast('Error saving entry: ' + error.message, 'error');
    } finally {
        // Re-enable submit button
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
    
    // Keep site, role, and pin saved
    const saved = getSavedFormData();
    if (saved) {
        document.getElementById('site').value = saved.site || '';
        document.getElementById('staffRole').value = saved.staffRole || '';
        document.getElementById('staffPin').value = saved.staffPin || '';
    }
}

// ==========================================
// MY HISTORY VIEW
// ==========================================

function initializeHistoryView() {
    // History view is loaded when tab is clicked
}

async function loadMyHistory() {
    const historyContent = document.getElementById('historyContent');
    const saved = getSavedFormData();

    console.log('Loading history for:', saved);

    if (!saved || !saved.site || !saved.staffPin) {
        historyContent.innerHTML = `
            <div class="empty-state">
                <span class="empty-icon">📋</span>
                <p>Please submit an entry first to view your history</p>
            </div>
        `;
        return;
    }

    // Show loading
    historyContent.innerHTML = `
        <div class="loading-skeleton">
            <div class="skeleton-card"></div>
            <div class="skeleton-card"></div>
            <div class="skeleton-card"></div>
        </div>
    `;

    try {
        // ALIGNED: key in URL, path in URL
        const url = `${CONFIG.API_BASE}?key=${encodeURIComponent(CONFIG.SHARED_KEY)}&path=history&site=${encodeURIComponent(saved.site)}&staffPin=${encodeURIComponent(saved.staffPin)}`;
        console.log('Fetching history:', url);
        
        const response = await fetch(url);
        const result = await response.json();
        console.log('History result:', result);

        if (result.error) {
            throw new Error(result.error);
        }

        if (result.entries && result.entries.length > 0) {
            displayHistoryEntries(result.entries);
        } else {
            historyContent.innerHTML = `
                <div class="empty-state">
                    <span class="empty-icon">📋</span>
                    <p>No entries found yet. Start by creating your first journal entry!</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading history:', error);
        historyContent.innerHTML = `
            <div class="empty-state">
                <span class="empty-icon">⚠️</span>
                <p>Error loading history: ${error.message}</p>
            </div>
        `;
    }
}

function displayHistoryEntries(entries) {
    const historyContent = document.getElementById('historyContent');
    const html = entries.map((entry, index) => createEntryCard(entry, index)).join('');
    historyContent.innerHTML = html;

    // Add click handlers to expand cards
    document.querySelectorAll('.entry-card').forEach((card) => {
        card.addEventListener('click', () => {
            const details = card.querySelector('.entry-details');
            details.classList.toggle('expanded');
        });
    });
}

// ==========================================
// SCHOLAR LOOKUP VIEW
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
            showToast('Please enter a scholar identifier', 'error');
        }
    });

    lookupInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            lookupBtn.click();
        }
    });

    // Filter chips
    filterChips.forEach(chip => {
        chip.addEventListener('click', () => {
            filterChips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            state.currentFilter = chip.dataset.days === 'all' ? 'all' : parseInt(chip.dataset.days);
            
            // Re-filter if we have data
            if (state.scholarHistoryData.length > 0) {
                displayScholarEntries(state.scholarHistoryData);
            }
        });
    });
}

async function loadScholarHistory(scholarId) {
    const scholarContent = document.getElementById('scholarContent');
    const saved = getSavedFormData();

    console.log('Loading scholar history for:', scholarId, 'at site:', saved.site);

    if (!saved || !saved.site) {
        showToast('Please submit an entry first to set your site', 'error');
        return;
    }

    // Show loading
    scholarContent.innerHTML = `
        <div class="loading-skeleton">
            <div class="skeleton-card"></div>
            <div class="skeleton-card"></div>
        </div>
    `;

    try {
        // ALIGNED: key in URL, path in URL
        const url = `${CONFIG.API_BASE}?key=${encodeURIComponent(CONFIG.SHARED_KEY)}&path=scholarHistory&site=${encodeURIComponent(saved.site)}&scholarId=${encodeURIComponent(scholarId)}`;
        console.log('Fetching scholar history:', url);
        
        const response = await fetch(url);
        const result = await response.json();
        console.log('Scholar history result:', result);

        if (result.error) {
            throw new Error(result.error);
        }

        state.scholarHistoryData = result.entries || [];

        if (state.scholarHistoryData.length > 0) {
            displayScholarEntries(state.scholarHistoryData);
        } else {
            scholarContent.innerHTML = `
                <div class="empty-state">
                    <span class="empty-icon">🔍</span>
                    <p>No entries found for scholar "${scholarId}"</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading scholar history:', error);
        scholarContent.innerHTML = `
            <div class="empty-state">
                <span class="empty-icon">⚠️</span>
                <p>Error loading scholar history: ${error.message}</p>
            </div>
        `;
    }
}

function displayScholarEntries(entries) {
    const scholarContent = document.getElementById('scholarContent');
    
    // Apply time filter
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
                <p>No entries in selected time period</p>
            </div>
        `;
        return;
    }

    const html = filteredEntries.map((entry, index) => createEntryCard(entry, index)).join('');
    scholarContent.innerHTML = html;

    // Add click handlers to expand cards
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

function createEntryCard(entry, index) {
    const date = new Date(entry.timestamp);
    const formattedDate = formatDate(date);
    const ratingClass = entry.performanceRating.toLowerCase().replace(/\s+/g, '-');

    return `
        <div class="entry-card" data-index="${index}">
            <div class="entry-header">
                <div>
                    <div class="entry-title">Scholar ${entry.scholarId}</div>
                    <div class="entry-meta">${entry.skillArea}</div>
                    <div class="performance-badge ${ratingClass}">
                        ${entry.performanceRating}
                    </div>
                </div>
                <div class="entry-meta">${formattedDate}</div>
            </div>
            
            <div class="entry-details">
                ${entry.specificSkillTarget ? `
                    <div class="detail-row">
                        <div class="detail-label">Specific Target</div>
                        <div class="detail-value">${entry.specificSkillTarget}</div>
                    </div>
                ` : ''}
                
                <div class="detail-row">
                    <div class="detail-label">Evidence Type</div>
                    <div class="detail-value">${entry.evidenceType}</div>
                </div>
                
                ${entry.optionalNote ? `
                    <div class="detail-row">
                        <div class="detail-label">Notes</div>
                        <div class="detail-value">${entry.optionalNote}</div>
                    </div>
                ` : ''}
                
                ${entry.staffRole ? `
                    <div class="detail-row">
                        <div class="detail-label">Staff Role</div>
                        <div class="detail-value">${entry.staffRole}</div>
                    </div>
                ` : ''}
                
                ${entry.evidenceImageUrl ? `
                    <div class="entry-image">
                        <div class="detail-label">Evidence Image</div>
                        <a href="${entry.evidenceImageUrl}" target="_blank" rel="noopener noreferrer">
                            <img src="${entry.evidenceImageUrl}" alt="Evidence" loading="lazy">
                        </a>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
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
    if (saved.site) {
        document.getElementById('site').value = saved.site;
    }
    if (saved.staffRole) {
        document.getElementById('staffRole').value = saved.staffRole;
    }
    if (saved.staffPin) {
        document.getElementById('staffPin').value = saved.staffPin;
    }
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
    }, 3000);
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

// Make removeImage function globally accessible
window.removeImage = removeImage;

// Production ready indicator
console.log('%c✓ NJTC Progress Journal v1.0', 'color: #003f87; font-weight: bold; font-size: 14px;');
console.log('%c100% Aligned - All Systems Connected', 'color: #10b981; font-size: 12px;');
