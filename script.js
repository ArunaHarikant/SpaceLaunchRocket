const API_URL = 'https://lldev.thespacedevs.com/2.2.0/launch/upcoming/?limit=10';

let nextLaunchDate = null;
let countdownInterval = null;

async function fetchLaunches() {
    try {
        // Adding a timestamp to bypass aggressive browser caching from GitHub Pages
        const response = await fetch(API_URL + '&timestamp=' + new Date().getTime());
        const data = await response.json();
        
        if (data.detail && data.detail.includes("throttled")) {
            // Rate limit triggered!
            document.getElementById('countdown').textContent = "API Rate Limit Hit!";
            document.getElementById('next-launch-details').innerHTML = `<p style="color: #ff6b6b;">${data.detail}</p><p>The Space Devs API only allows 15 requests per hour. Please wait a bit and refresh.</p>`;
            document.getElementById('launches-container').innerHTML = "<p>Data temporarily restricted due to API limits.</p>";
            return;
        }

        if (data && data.results && data.results.length > 0) {
            displayLaunches(data.results);
        } else {
            document.getElementById('countdown').textContent = "No upcoming launches found.";
            document.getElementById('launches-container').innerHTML = "<p>No data available right now.</p>";
        }
    } catch (error) {
        console.error('Error fetching launch data:', error);
        document.getElementById('countdown').textContent = "Error loading data.";
        document.getElementById('launches-container').innerHTML = "<p>Could not connect to the launch database. Please try again later.</p>";
    }
}

function displayLaunches(launches) {
    const nextLaunch = launches[0];
    const futureLaunches = launches.slice(1);
    
    // Set next launch data
    const nextDetails = document.getElementById('next-launch-details');
    nextLaunchDate = new Date(nextLaunch.net);
    
    nextDetails.innerHTML = `
        <p><strong>Mission:</strong> ${nextLaunch.mission?.name || nextLaunch.name}</p>
        <p><strong>Rocket:</strong> ${nextLaunch.rocket?.configuration?.name || 'Unknown'}</p>
        <p><strong>Launch Site:</strong> ${nextLaunch.pad?.name || 'Unknown'} - ${nextLaunch.pad?.location?.name || 'Unknown'}</p>
        <p><strong>Date/Time (Local):</strong> ${nextLaunchDate.toLocaleString()}</p>
    `;

    // Start countdown
    if (countdownInterval) clearInterval(countdownInterval);
    updateCountdown();
    countdownInterval = setInterval(updateCountdown, 1000);

    // Set future launches
    const container = document.getElementById('launches-container');
    container.innerHTML = futureLaunches.map(launch => {
        const date = new Date(launch.net);
        return `
            <div class="launch-card">
                <h3>${launch.mission?.name || launch.name}</h3>
                <p><strong>Rocket:</strong> ${launch.rocket?.configuration?.name || 'Unknown'}</p>
                <p><strong>Launch Site:</strong> ${launch.pad?.name || 'Unknown'}</p>
                <p><strong>Date:</strong> ${date.toLocaleString()}</p>
            </div>
        `;
    }).join('');
}

function updateCountdown() {
    if (!nextLaunchDate) return;

    const now = new Date();
    const diff = nextLaunchDate - now;

    if (diff <= 0) {
        document.getElementById('countdown').textContent = "🚀 LIFT OFF! 🚀";
        clearInterval(countdownInterval);
        
        // Refresh data after a short wait
        setTimeout(fetchLaunches, 60000);
        return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / 1000 / 60) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    let display = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    if (days > 0) {
        display = `${days}d ` + display;
    }

    document.getElementById('countdown').textContent = `T- ${display}`;
}

// Initial fetch
fetchLaunches();