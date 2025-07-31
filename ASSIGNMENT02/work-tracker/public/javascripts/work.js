// Work functionality
function initializeWorkDashboard() {
    // Delete modal functionality for dashboard
    const deleteButtons = document.querySelectorAll('[data-bs-target="#deleteModal"]');
    
    if (deleteButtons.length > 0) {
        deleteButtons.forEach(button => {
            button.addEventListener('click', function() {
                const entryId = button.getAttribute('data-entry-id');
                const projectName = button.getAttribute('data-entry-project');
                
                document.getElementById('deleteProjectName').textContent = projectName;
                document.getElementById('deleteForm').action = '/work/delete/' + entryId;
            });
        });
    }
    
    // Filter toggle functionality
    const toggleButton = document.getElementById('toggleFilters');
    const filterPanel = document.getElementById('filterPanel');
    const toggleText = document.getElementById('filterToggleText');
    
    if (toggleButton && filterPanel) {
        // Check if filters are active and show panel if they are
        const urlParams = new URLSearchParams(window.location.search);
        const hasActiveFilters = urlParams.get('project') || urlParams.get('dateFrom') || 
                                urlParams.get('dateTo') || urlParams.get('search') || 
                                (urlParams.get('sortBy') && urlParams.get('sortBy') !== 'date-desc');
        
        if (hasActiveFilters) {
            filterPanel.style.display = 'block';
            toggleText.textContent = 'Hide Filters';
            toggleButton.querySelector('i').className = 'fas fa-chevron-up me-1';
        }
        
        toggleButton.addEventListener('click', function() {
            if (filterPanel.style.display === 'none') {
                filterPanel.style.display = 'block';
                toggleText.textContent = 'Hide Filters';
                toggleButton.querySelector('i').className = 'fas fa-chevron-up me-1';
            } else {
                filterPanel.style.display = 'none';
                toggleText.textContent = 'Show Filters';
                toggleButton.querySelector('i').className = 'fas fa-chevron-down me-1';
            }
        });
        
        // Auto-submit on change for better UX
        const filterInputs = filterPanel.querySelectorAll('select, input[type="date"]');
        filterInputs.forEach(input => {
            input.addEventListener('change', function() {
                // Don't auto-submit for text search
                if (this.type !== 'text') {
                    this.closest('form').submit();
                }
            });
        });
        
        // Submit on Enter for search input
        const searchInput = document.getElementById('search');
        if (searchInput) {
            searchInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.closest('form').submit();
                }
            });
        }
    }
}

function initializeWorkForms() {
    // Set today's date as default for add forms
    const dateInput = document.getElementById('date');
    if (dateInput && !dateInput.value) {
        dateInput.valueAsDate = new Date();
    }
    
    // Auto-calculate hours and earnings with tax breakdown
    const startTime = document.getElementById('startTime');
    const endTime = document.getElementById('endTime');
    const breakTime = document.getElementById('breakTime');
    const projectSelect = document.getElementById('projectId');
    
    if (startTime && endTime && projectSelect) {
        // Create earnings preview container
        const existingPreview = document.getElementById('earningsPreview');
        if (!existingPreview) {
            const earningsPreview = document.createElement('div');
            earningsPreview.id = 'earningsPreview';
            earningsPreview.className = 'alert alert-info mt-3';
            earningsPreview.style.display = 'none';
            
            const form = document.querySelector('.form-body form');
            if (form) {
                form.appendChild(earningsPreview);
            }
        }
        
        function getSelectedHourlyRate() {
            const selectedOption = projectSelect.options[projectSelect.selectedIndex];
            console.log('Selected option:', selectedOption); // Debug log
            console.log('Dataset rate:', selectedOption?.dataset?.rate); // Debug log
            return selectedOption && selectedOption.dataset.rate ? parseFloat(selectedOption.dataset.rate) : 0;
        }
        
        function updateCalculation() {
            const hourlyRate = getSelectedHourlyRate();
            const earningsPreview = document.getElementById('earningsPreview');
            
            if (startTime.value && endTime.value && hourlyRate > 0 && earningsPreview) {
                const start = new Date('2000-01-01 ' + startTime.value);
                const end = new Date('2000-01-01 ' + endTime.value);
                const breakMinutes = parseInt(breakTime?.value) || 0;
                
                if (end > start) {
                    let totalMinutes = (end - start) / (1000 * 60);
                    totalMinutes -= breakMinutes;
                    const hours = Math.max(0, totalMinutes / 60);
                    
                    // Get overtime multiplier from pay type radio buttons
                    const payTypeRadios = document.querySelectorAll('input[name="payType"]');
                    let overtimeMultiplier = 1.0;
                    for (const radio of payTypeRadios) {
                        if (radio.checked) {
                            // Map string values to multipliers
                            switch (radio.value) {
                                case 'regular':
                                    overtimeMultiplier = 1.0;
                                    break;
                                case 'overtime':
                                    overtimeMultiplier = 1.5;
                                    break;
                                case 'double':
                                    overtimeMultiplier = 2.0;
                                    break;
                                default:
                                    overtimeMultiplier = 1.0;
                            }
                            break;
                        }
                    }
                    
                    const effectiveHourlyRate = hourlyRate * overtimeMultiplier;
                    const grossEarnings = hours * effectiveHourlyRate;
                    
                    // Simplified tax calculation for preview
                    const estimatedAnnualIncome = hourlyRate * 40 * 52;
                    const federalTaxRate = estimatedAnnualIncome <= 53359 ? 0.15 : 0.205;
                    const provincialTaxRate = 0.0505; // Ontario base rate
                    const cppRate = 0.0595;
                    const eiRate = 0.0188;
                    
                    const totalTaxRate = federalTaxRate + provincialTaxRate + (cppRate * 0.5) + (eiRate * 0.5);
                    const deductions = grossEarnings * totalTaxRate;
                    const netEarnings = grossEarnings - deductions;
                    
                    earningsPreview.innerHTML = `
                        <h6><i class="fas fa-calculator me-2"></i>Earnings Preview</h6>
                        <div class="row">
                            <div class="col-md-6">
                                <small>Work Hours: <strong>${hours.toFixed(2)}</strong></small><br>
                                <small>Base Rate: <strong>$${hourlyRate.toFixed(2)}/hr</strong></small><br>
                                ${overtimeMultiplier !== 1.0 ? `<small>Pay Type: <strong>${overtimeMultiplier}x ${overtimeMultiplier === 1.5 ? '(Time & Half)' : overtimeMultiplier === 2.0 ? '(Double Time)' : ''}</strong></small><br>` : ''}
                                ${overtimeMultiplier !== 1.0 ? `<small>Effective Rate: <strong>$${effectiveHourlyRate.toFixed(2)}/hr</strong></small><br>` : ''}
                                <small>Gross Earnings: <strong>$${grossEarnings.toFixed(2)}</strong></small>
                            </div>
                            <div class="col-md-6">
                                <small>Est. Deductions: <strong>$${deductions.toFixed(2)}</strong></small><br>
                                <small>Est. Net Earnings: <strong>$${netEarnings.toFixed(2)}</strong></small>
                            </div>
                        </div>
                    `;
                    earningsPreview.style.display = 'block';
                }
            } else {
                if (earningsPreview) {
                    earningsPreview.style.display = 'none';
                }
            }
        }
        
        startTime.addEventListener('change', updateCalculation);
        endTime.addEventListener('change', updateCalculation);
        if (breakTime) breakTime.addEventListener('input', updateCalculation);
        projectSelect.addEventListener('change', updateCalculation);
        
        // Add event listeners for pay type radio buttons
        const payTypeRadios = document.querySelectorAll('input[name="payType"]');
        payTypeRadios.forEach(radio => {
            radio.addEventListener('change', updateCalculation);
        });
        
        // Initial calculation if values are already set
        updateCalculation();
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeWorkDashboard();
    initializeWorkForms();
});
