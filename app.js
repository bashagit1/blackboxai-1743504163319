// VitalSigns MY - Core Application Logic
// Data Storage
let vitalsData = JSON.parse(localStorage.getItem('vitalsData')) || [];

// Utility Functions
const saveData = () => {
  localStorage.setItem('vitalsData', JSON.stringify(vitalsData));
};

const getPatientName = (id) => {
  const patients = {
    'PT001': 'Ahmad bin Ali',
    'PT002': 'Siti binti Abu', 
    'PT003': 'Rajesh a/l Kumar'
  };
  return patients[id] || 'Unknown Patient';
};

// Form Submission Handler
if (document.getElementById('vitalsForm')) {
  document.getElementById('vitalsForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const form = e.target;
    const now = new Date();
    const formattedDate = now.toISOString().slice(0, 16);
    
    const entry = {
      patientId: form.patientId.value,
      patientName: getPatientName(form.patientId.value),
      dateTime: form.dateTime.value || formattedDate,
      systolic: parseInt(form.systolic.value),
      diastolic: parseInt(form.diastolic.value),
      pulse: parseInt(form.pulse.value),
      spo2: parseInt(form.spo2.value),
      temperature: parseFloat(form.temperature.value),
      glucose: parseInt(form.glucose.value),
      notes: form.notes.value,
      timestamp: new Date().getTime()
    };

    // Basic Validation
    if (entry.systolic < 50 || entry.systolic > 300) {
      alert('Systolic BP must be between 50-300 mmHg');
      return;
    }

    vitalsData.push(entry);
    saveData();
    
    // Show success message
    const feedback = document.createElement('div');
    feedback.className = 'bg-green-100 text-green-800 p-3 rounded mb-4';
    feedback.innerHTML = `
      <i class="fas fa-check-circle mr-2"></i>
      Vitals recorded successfully for ${entry.patientName}
    `;
    form.prepend(feedback);
    
    // Clear form after 2 seconds
    setTimeout(() => {
      form.reset();
      feedback.remove();
    }, 2000);
  });
}

// Dashboard Chart Initialization
if (document.getElementById('bpChart')) {
  // Sort by date for charts
  vitalsData.sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));
  
  const labels = vitalsData.map(entry => 
    new Date(entry.dateTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
  );

  const bpChart = new Chart(
    document.getElementById('bpChart').getContext('2d'),
    {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Systolic',
            data: vitalsData.map(entry => entry.systolic),
            borderColor: '#003366',
            backgroundColor: 'rgba(0, 51, 102, 0.1)',
            tension: 0.3
          },
          {
            label: 'Diastolic',
            data: vitalsData.map(entry => entry.diastolic),
            borderColor: '#FFD700',
            backgroundColor: 'rgba(255, 215, 0, 0.1)',
            tension: 0.3
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: false,
            min: 50,
            max: 200
          }
        }
      }
    }
  );

  // Add chart update functions
  window.updateCharts = (patientId = 'all') => {
    const filteredData = patientId === 'all' 
      ? vitalsData 
      : vitalsData.filter(entry => entry.patientId === patientId);
    
    const filteredLabels = filteredData.map(entry => 
      new Date(entry.dateTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    );

    bpChart.data.labels = filteredLabels;
    bpChart.data.datasets[0].data = filteredData.map(entry => entry.systolic);
    bpChart.data.datasets[1].data = filteredData.map(entry => entry.diastolic);
    bpChart.update();
  };

  // Connect dropdowns
  document.getElementById('patientSelect').addEventListener('change', (e) => {
    updateCharts(e.target.value);
  });
}

// Patient Records Table
if (document.getElementById('search')) {
  const renderRecordsTable = (data = vitalsData) => {
    const tbody = document.querySelector('tbody');
    tbody.innerHTML = data.map(entry => `
      <tr class="hover:bg-gray-50">
        <td class="px-6 py-4 whitespace-nowrap">${entry.patientId}</td>
        <td class="px-6 py-4 whitespace-nowrap">${entry.patientName}</td>
        <td class="px-6 py-4 whitespace-nowrap">${new Date(entry.dateTime).toLocaleString()}</td>
        <td class="px-6 py-4 whitespace-nowrap ${
          entry.systolic > 140 ? 'text-red-600 font-semibold' : ''
        }">${entry.systolic}/${entry.diastolic}</td>
        <td class="px-6 py-4 whitespace-nowrap">${entry.pulse}</td>
        <td class="px-6 py-4 whitespace-nowrap">${entry.spo2}%</td>
        <td class="px-6 py-4 whitespace-nowrap">${entry.temperature}°C</td>
        <td class="px-6 py-4 whitespace-nowrap ${
          entry.glucose > 140 ? 'text-yellow-600 font-semibold' : ''
        }">${entry.glucose}</td>
        <td class="px-6 py-4 whitespace-nowrap">
          <button class="text-blue-600 hover:text-blue-800 mr-2">
            <i class="fas fa-eye"></i>
          </button>
          <button class="text-red-600 hover:text-red-800 delete-btn" data-id="${entry.timestamp}">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      </tr>
    `).join('');

    // Add delete handlers
    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const timestamp = parseInt(e.currentTarget.getAttribute('data-id'));
        vitalsData = vitalsData.filter(entry => entry.timestamp !== timestamp);
        saveData();
        renderRecordsTable();
      });
    });
  };

  // Initial render
  renderRecordsTable();

  // Search functionality
  document.getElementById('search').addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    const filtered = vitalsData.filter(entry => 
      entry.patientId.toLowerCase().includes(query) || 
      entry.patientName.toLowerCase().includes(query)
    );
    renderRecordsTable(filtered);
  });

  // Date filtering
  document.getElementById('dateFrom').addEventListener('change', filterByDate);
  document.getElementById('dateTo').addEventListener('change', filterByDate);

  function filterByDate() {
    const from = document.getElementById('dateFrom').value;
    const to = document.getElementById('dateTo').value;
    
    let filtered = vitalsData;
    
    if (from) {
      filtered = filtered.filter(entry => 
        new Date(entry.dateTime) >= new Date(from)
      );
    }
    
    if (to) {
      filtered = filtered.filter(entry => 
        new Date(entry.dateTime) <= new Date(to + 'T23:59:59')
      );
    }
    
    renderRecordsTable(filtered);
  }
}

// Reports Page
if (document.getElementById('generatePdfBtn')) {
  document.getElementById('generatePdfBtn').addEventListener('click', () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text('Vital Signs Report', 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, 105, 30, { align: 'center' });
    
    // Add table with patient data
    const headers = [['Patient ID', 'Name', 'BP', 'Pulse', 'SpO₂', 'Temp', 'Glucose']];
    const data = vitalsData.map(entry => [
      entry.patientId,
      entry.patientName,
      `${entry.systolic}/${entry.diastolic}`,
      entry.pulse,
      `${entry.spo2}%`,
      `${entry.temperature}°C`,
      entry.glucose
    ]);
    
    doc.autoTable({
      head: headers,
      body: data,
      startY: 40,
      styles: {
        halign: 'center',
        cellPadding: 3
      },
      headStyles: {
        fillColor: [0, 51, 102],
        textColor: 255
      }
    });
    
    doc.save('vitals-report.pdf');
  });

  document.getElementById('generateCsvBtn').addEventListener('click', () => {
    const csvContent = "data:text/csv;charset=utf-8," +
      "Patient ID,Name,Date/Time,Systolic,Diastolic,Pulse,SpO2,Temperature,Glucose,Notes\n" +
      vitalsData.map(entry => 
        `"${entry.patientId}","${entry.patientName}","${entry.dateTime}",${entry.systolic},${entry.diastolic},${entry.pulse},${entry.spo2},${entry.temperature},${entry.glucose},"${entry.notes}"`
      ).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "vitals_data.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });
}
