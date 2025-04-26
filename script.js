// API URLs
const COUNTRIES_API = 'https://restcountries.com/v3.1';
const WEATHER_API = 'https://api.openweathermap.org/data/2.5/weather';
const WEATHER_API_KEY = '906fc66e1f7109aede40a0d7515477ba'; // Replace with your OpenWeatherMap API key

// DOM Elements
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const countryGrid = document.getElementById('countryGrid');

// Event Listeners
searchBtn.addEventListener('click', searchCountries);
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') searchCountries();
});

// Load all countries on page load
window.addEventListener('load', () => {
    fetchAllCountries();
});

async function fetchAllCountries() {
    try {
        const response = await fetch(`${COUNTRIES_API}/all`);
        if (!response.ok) throw new Error('Failed to fetch countries');
        const countries = await response.json();
        displayCountries(countries);
    } catch (error) {
        console.error('Error:', error);
        countryGrid.innerHTML = '<p class="error">Failed to load countries. Please try again later.</p>';
    }
}

async function searchCountries() {
    const searchTerm = searchInput.value.trim();
    if (!searchTerm) {
        fetchAllCountries();
        return;
    }

    try {
        const response = await fetch(`${COUNTRIES_API}/name/${searchTerm}`);
        if (!response.ok) throw new Error('Country not found');
        const countries = await response.json();
        displayCountries(countries);
    } catch (error) {
        countryGrid.innerHTML = '<p class="error">No countries found. Please try another search.</p>';
    }
}

function displayCountries(countries) {
    countryGrid.innerHTML = '';
    
    countries.forEach(country => {
        const countryCard = document.createElement('div');
        countryCard.className = 'country-card';
        
        const languages = country.languages ? Object.values(country.languages).join(', ') : 'N/A';
        const currencies = country.currencies ? Object.values(country.currencies).map(curr => curr.name).join(', ') : 'N/A';
        
        // Create a brief description
        const description = `${country.name.common} is a ${country.independent ? 'sovereign' : 'dependent'} country in ${country.region}${country.subregion ? ', ' + country.subregion : ''}, with a population of ${country.population.toLocaleString()} people. The capital ${country.capital?.[0] ? 'is ' + country.capital[0] : 'information is not available'}${languages !== 'N/A' ? '. The main language(s) spoken: ' + languages : ''}.`;
        
        countryCard.innerHTML = `
            <img src="${country.flags.png}" alt="${country.name.common} flag" class="country-flag">
            <div class="country-info">
                <h2 class="country-name">${country.name.common}</h2>
                <p class="country-description">${description}</p>
                <div class="country-details">
                    <p><strong>Capital:</strong> ${country.capital?.[0] || 'N/A'}</p>
                    <p><strong>Region:</strong> ${country.region}</p>
                    <p><strong>Population:</strong> ${country.population.toLocaleString()}</p>
                </div>
                <button class="more-details-btn" onclick="showDetails('${country.capital?.[0] || ''}', ${JSON.stringify(country).replace(/"/g, '&quot;')})">
                    More Details
                </button>
            </div>
        `;
        
        countryGrid.appendChild(countryCard);
    });
}

async function getWeatherData(city) {
    try {
        // Using a CORS proxy to bypass CORS restrictions
        const corsProxy = 'https://api.allorigins.win/raw?url=';
        const encodedUrl = encodeURIComponent(`${WEATHER_API}?q=${city}&appid=${WEATHER_API_KEY}&units=metric`);
        
        const response = await fetch(`${corsProxy}${encodedUrl}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) throw new Error('Weather data not available');
        return await response.json();
    } catch (error) {
        console.error('Error fetching weather:', error);
        throw error;
    }
}

async function showDetails(capital, country) {
    if (!capital) {
        alert('Weather data not available for this country (no capital city found)');
        return;
    }

    try {
        const weatherData = await getWeatherData(capital);

        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close-btn" onclick="this.parentElement.parentElement.remove()">&times;</span>
                <div class="modal-header">
                    <h2>${country.name.common}</h2>
                    <img src="${country.flags.png}" alt="${country.name.common} flag" class="modal-flag">
                </div>
                
                <div class="modal-body">
                    <div class="country-section">
                        <h3>Country Details</h3>
                        <p><strong>Official Name:</strong> ${country.name.official}</p>
                        <p><strong>Capital:</strong> ${country.capital?.[0] || 'N/A'}</p>
                        <p><strong>Population:</strong> ${country.population.toLocaleString()}</p>
                        <p><strong>Region:</strong> ${country.region}</p>
                        <p><strong>Subregion:</strong> ${country.subregion || 'N/A'}</p>
                        <p><strong>Languages:</strong> ${Object.values(country.languages || {}).join(', ') || 'N/A'}</p>
                        <p><strong>Area:</strong> ${country.area?.toLocaleString() || 'N/A'} km²</p>
                    </div>

                    <div class="weather-section">
                        <h3>Current Weather in ${capital}</h3>
                        <div class="weather-info">
                            <img src="https://openweathermap.org/img/wn/${weatherData.weather[0].icon}@2x.png" alt="Weather icon">
                            <p class="temperature">${Math.round(weatherData.main.temp)}°C</p>
                            <p class="condition">${weatherData.weather[0].description}</p>
                            <div class="weather-details">
                                <p><strong>Feels like:</strong> ${Math.round(weatherData.main.feels_like)}°C</p>
                                <p><strong>Humidity:</strong> ${weatherData.main.humidity}%</p>
                                <p><strong>Wind Speed:</strong> ${weatherData.wind.speed} m/s</p>
                                <p><strong>Pressure:</strong> ${weatherData.main.pressure} hPa</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);

        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });

    } catch (error) {
        console.error('Error fetching weather data:', error);
        alert('Failed to fetch weather data. Please try again later.');
    }
}

// Add error handling for fetch requests
window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled promise rejection:', event.reason);
});