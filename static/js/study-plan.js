// Study Plan Generation

function initializeStudyPlanForm() {
    const studyPlanForm = document.getElementById('study-plan-form');
    const studyPlanResults = document.getElementById('study-plan-results');
    const studyPlanLoading = document.getElementById('study-plan-loading');
    
    if (!studyPlanForm) {
        console.error('Study plan form not found in the DOM');
        return;
    }
    
    // Handle form submission
    studyPlanForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Check if files have been uploaded
        const fileList = getUploadedFiles();
        if (!fileList || fileList.length === 0) {
            showToast('Please upload study materials first!', 'error');
            return;
        }
        
        const studyGoal = document.getElementById('study-goal').value;
        const deadlineDate = document.getElementById('deadline-date').value;
        const deadlineTime = document.getElementById('deadline-time').value;
        
        if (!studyGoal || !deadlineDate || !deadlineTime) {
            showToast('Please fill out all fields', 'error');
            return;
        }
        
        // Show loading state
        if (studyPlanLoading) {
            studyPlanLoading.classList.remove('hidden');
        }
        if (studyPlanResults) {
            studyPlanResults.classList.add('hidden');
        }
        
        // Combine date and time
        const deadline = `${deadlineDate}T${deadlineTime}`;
        
        // Make request to generate study plan
        generateStudyPlan(studyGoal, deadline);
    });
}

function generateStudyPlan(studyGoal, deadline) {
    fetch('/api/generate-plan', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            goal: studyGoal,
            deadline: deadline
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        // Hide loading state
        const studyPlanLoading = document.getElementById('study-plan-loading');
        const studyPlanResults = document.getElementById('study-plan-results');
        
        if (studyPlanLoading) {
            studyPlanLoading.classList.add('hidden');
        }
        
        if (studyPlanResults) {
            studyPlanResults.classList.remove('hidden');
        }
        
        // Display study plan
        displayStudyPlan(data.plan);
        
        // Show success message
        showToast('Your personalized study plan is ready!', 'success');
        
        // Trigger event that plan is ready for other components to use
        document.dispatchEvent(new CustomEvent('studyPlanGenerated', {
            detail: data.plan
        }));
    })
    .catch(error => {
        console.error('Error:', error);
        
        // Hide loading state
        const studyPlanLoading = document.getElementById('study-plan-loading');
        if (studyPlanLoading) {
            studyPlanLoading.classList.add('hidden');
        }
        
        // Show error message
        showToast('Failed to generate study plan. Please try again.', 'error');
    });
}

function displayStudyPlan(plan) {
    const studyPlanResults = document.getElementById('study-plan-results');
    if (!studyPlanResults) return;
    
    studyPlanResults.innerHTML = '';
    
    // Add header
    const header = document.createElement('div');
    header.className = 'card-header';
    header.innerHTML = `
        <h3>Your Personalized Study Plan</h3>
        <p class="text-muted">Designed specifically for your materials and goals</p>
    `;
    studyPlanResults.appendChild(header);
    
    // Add overview section if it exists
    if (plan.overview) {
        const overview = document.createElement('div');
        overview.className = 'plan-overview mb-3';
        overview.innerHTML = `
            <h4>Overview</h4>
            <p>${plan.overview}</p>
        `;
        studyPlanResults.appendChild(overview);
    }
    
    // Add milestones section
    const milestonesContainer = document.createElement('div');
    milestonesContainer.className = 'milestones';
    
    if (plan.milestones && plan.milestones.length > 0) {
        plan.milestones.forEach(milestone => {
            const milestoneElement = document.createElement('div');
            milestoneElement.className = 'milestone';
            
            let tasksHTML = '';
            if (milestone.tasks && milestone.tasks.length > 0) {
                tasksHTML = '<ul class="tasks">';
                milestone.tasks.forEach(task => {
                    tasksHTML += `<li class="task"><i class="fas fa-check-circle"></i> ${task}</li>`;
                });
                tasksHTML += '</ul>';
            }
            
            // Check if there's a unit property in the milestone
            const unitHTML = milestone.unit ? `<div class="milestone-unit"><span class="unit-label">Unit:</span> ${milestone.unit}</div>` : '';
            
            milestoneElement.innerHTML = `
                <div class="milestone-date">${formatDate(milestone.date)}</div>
                <h4>${milestone.title}</h4>
                ${unitHTML}
                <p>${milestone.description || ''}</p>
                ${tasksHTML}
            `;
            
            milestonesContainer.appendChild(milestoneElement);
        });
    } else {
        // Fallback if milestones aren't structured as expected
        const planContent = document.createElement('div');
        planContent.innerHTML = typeof plan === 'string' ? plan : JSON.stringify(plan);
        milestonesContainer.appendChild(planContent);
    }
    
    studyPlanResults.appendChild(milestonesContainer);
    
    // Add print/export button
    const actionsContainer = document.createElement('div');
    actionsContainer.className = 'actions mt-3';
    actionsContainer.innerHTML = `
        <button class="btn btn-secondary" onclick="printStudyPlan()">
            <i class="fas fa-print"></i> Print Plan
        </button>
    `;
    studyPlanResults.appendChild(actionsContainer);
}

function printStudyPlan() {
    const studyPlanResults = document.getElementById('study-plan-results');
    if (!studyPlanResults) return;
    
    const printWindow = window.open('', '_blank');
    
    if (!printWindow) {
        showToast('Please allow pop-ups to print your study plan', 'error');
        return;
    }
    
    // Create a stylized version for printing
    printWindow.document.write(`
        <html>
        <head>
            <title>Exam Pal - Your Study Plan</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    padding: 20px;
                }
                h1, h2, h3, h4 {
                    color: #7F5AF0;
                    margin-top: 20px;
                }
                .milestone {
                    border-left: 3px solid #7F5AF0;
                    padding-left: 20px;
                    margin-bottom: 30px;
                }
                .milestone-date {
                    font-weight: bold;
                    color: #7F5AF0;
                }
                .tasks {
                    list-style-type: none;
                    padding-left: 0;
                }
                .task {
                    margin-bottom: 10px;
                    display: flex;
                    align-items: flex-start;
                }
                .task:before {
                    content: "✓";
                    color: #2CB67D;
                    margin-right: 10px;
                }
                .header-info {
                    margin-bottom: 30px;
                    border-bottom: 1px solid #eee;
                    padding-bottom: 20px;
                }
            </style>
        </head>
        <body>
            <div class="header-info">
                <h1>Your Exam Pal Study Plan</h1>
                <p>Generated on: ${new Date().toLocaleDateString()}</p>
            </div>
            ${studyPlanResults.innerHTML}
        </body>
        </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    // Wait for resources to load then print
    setTimeout(() => {
        printWindow.print();
        // printWindow.close();
    }, 500);
}
