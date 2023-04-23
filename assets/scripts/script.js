// Current weather stored in an object for easier tracking
var currentWeather = {
    name: "",
    date: "",
    temp: "",
    humidity: "",
    wind: "",
    uv: "",
    uvAlert: "",
    icon: ""
}

// Array for storing the forecast data as objects
var forecast = [];

// Array for storing previously searched cities
var searchHistory = [];

// OpenWeather API key
var apiKey = "f74ffb79de2a139136c049a29d57f326";

// QuerySelectors for various page elements
var cityNameEl = document.querySelector("#name");
var curDateEl = document.querySelector("#date");
var curIconEl = document.querySelector("#icon");
var curTempEl = document.querySelector("#temp");
var curHumidityEl = document.querySelector("#humidity");
var curWindEl = document.querySelector("#wind");
var curUvEl = document.querySelector("#uv");
var searchInputEl = document.querySelector("#search-city");
var formEl = document.querySelector("#search-form");
var historyEl = document.querySelector("#history");
var clearBtnEl = document.querySelector("#clear-history");
var uvAlertEl = document.querySelector("#uv-alert");
var forecastEl = document.querySelector("#forecast-body");
var resultsContEl = document.querySelector("#results-container");
var forecastContEl = document.querySelector("#forecast-container");
var curStatsEl = document.querySelector("#current-stats");

// Function for making API calls to OpenWeather
var getWeather = function (city) {
    var apiUrl = "https://api.openweathermap.org/data/2.5/weather?q=" + city + "&units=imperial&appid=" + apiKey;
    var lat = "";
    var lon = "";
    fetch(apiUrl).then(function (response) {
        if (response.ok) {
            response.json().then(function (data) {
                currentWeather.name = data.name;
                currentWeather.date = moment().format("dddd, MMMM Do YYYY");
                currentWeather.temp = data.main.temp + " &#176F";
                currentWeather.humidity = data.main.humidity + "%";
                currentWeather.wind = data.wind.speed + " MPH";
                currentWeather.icon = data.weather[0].icon;
                lat = data.coord.lat;
                lon = data.coord.lon;

                var uvUrl = "https://api.openweathermap.org/data/2.5/uvi?appid=" + apiKey + "&lat=" + lat + "&lon=" + lon;
                fetch(uvUrl).then(function (uvResponse) {
                    if (uvResponse.ok) {
                        uvResponse.json().then(function (uvData) {
                            currentWeather.uv = uvData.value;
                            displayWeather();
                            getForecast(city);
                        });
                    } else {
                        curUvEl.innerHTML = "Error";
                        currentWeather.uv = "error";
                    }
                });
            });
        } else {
            clearData();
            cityNameEl.innerHTML = "Error: " + response.status + " " + city + " " + response.statusText;
        }
    }).catch(function (error) {
        cityNameEl.innerHTML = error.message + " Please try again later.";
    })
}

var getForecast = function(city) {
    var forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=imperial&appid=${apiKey}`;
  
    fetch(forecastUrl)
      .then(response => {
        if (response.ok) {
          response.json().then(data => {
            var today = moment().format("YYYY-MM-DD");
            for (let i = 0; i < data.list.length; i++) {
              var dateTime = data.list[i].dt_txt.split(' ');
              if (dateTime[0] !== today && dateTime[1] === "12:00:00") {
                var futureDate = {
                  date: moment(dateTime[0]).format("MM/DD/YYYY"),
                  time: dateTime[1],
                  icon: data.list[i].weather[0].icon,
                  temp: data.list[i].main.temp,
                  humidity: data.list[i].main.humidity
                };
                forecast.push(futureDate);
              }
            }
            displayForecast();
          })
        } else {
          forecastEl.innerHTML = `Error: ${response.status} ${response.statusText}`;
        }
      })
      .catch(error => {
        forecastEl.innerHTML = error.message;
      });
  };
  
  var displayForecast = function() {
    for (let i = 0; i < forecast.length; i++) {
      var cardContainerEl = document.createElement("div");
      cardContainerEl.classList.add("col-xl");
      cardContainerEl.classList.add("col-md-4");
  
      var cardEl = document.createElement("div");
      cardEl.classList.add("card");
      cardEl.classList.add("forecast-card");
  
      var cardBodyEl = document.createElement("div");
      cardBodyEl.classList.add("card-body");
  
      var dateEl = document.createElement("h5");
      dateEl.classList.add("card-title");
      dateEl.innerHTML = forecast[i].date;
      cardBodyEl.appendChild(dateEl);
  
      var iconEl = document.createElement("p");
      iconEl.classList.add("card-text");
      iconEl.innerHTML = `<img src='https://openweathermap.org/img/wn/${forecast[i].icon}@2x.png'></img>`;
      cardBodyEl.appendChild(iconEl);
  
      var tempEl = document.createElement("p");
      tempEl.classList.add("card-text");
      tempEl.innerHTML = `Temp: ${forecast[i].temp}`;
      cardBodyEl.appendChild(tempEl);
  
      var humidityEl = document.createElement("p");
      humidityEl.classList.add("card-text");
      humidityEl.innerHTML = `Humidity: ${forecast[i].humidity}`;
      cardBodyEl.appendChild(humidityEl);
  
      cardEl.appendChild(cardBodyEl);
      cardContainerEl.appendChild(cardEl);
      forecastEl.appendChild(cardContainerEl);
    }
  };
// Displays the current weather data
var displayWeather = function() {
    curStatsEl.style.display = "block";
    forecastContEl.style.display = "block";
    cityNameEl.innerHTML = currentWeather.name;
    curDateEl.innerHTML = currentWeather.date;
    curTempEl.innerHTML = currentWeather.temp;
    curHumidityEl.innerHTML = currentWeather.humidity;
    curWindEl.innerHTML = currentWeather.wind;
    curIconEl.innerHTML = "<img src='https://openweathermap.org/img/wn/" + currentWeather.icon + "@2x.png'>";
    uvCheck();
};

// Displays the search history in the history div element on the page
var displayHistory = function() {
    historyEl.innerHTML = "";
    for (var i = 0; i < searchHistory.length; i++) {
        var historyDiv = document.createElement("div");
        historyDiv.classList.add("history-item");
        historyDiv.innerHTML = "<h4>" + searchHistory[i] + "</h4>";
        historyEl.appendChild(historyDiv);
    }
};

// Loads the search history from localStorage into the searchHistory array and then calls displayHistory function
var loadHistory = function() {
    searchHistory = JSON.parse(localStorage.getItem("history")) || [];
    displayHistory();
};

// Validates the input value from the form, and then calls the getWeather function with the searchCity value
var formSubmitHandler = function(event) {
    event.preventDefault();
    var searchCity = searchInputEl.value.trim();
    if (searchCity) {
        getWeather(searchCity);
        searchHistory.push(searchCity);
        localStorage.setItem("history", JSON.stringify(searchHistory));
        clearForecast();
        displayHistory();
        searchInputEl.value = "";
    }
};

// Clears the search history
var clearHistory = function() {
    localStorage.removeItem("history");
    searchHistory = [];
    displayHistory();
};

// Checks the UV index from OpenWeather and sets the uvAlertEl text and color based on the index value
var uvCheck = function() {
    if (currentWeather.uv === "error") {
        return;
    }

    var alertClass;
    if (currentWeather.uv < 3) {
        currentWeather.uvAlert = "low";
        alertClass = "alert-success";
    } else if (currentWeather.uv < 6) {
        currentWeather.uvAlert = "moderate";
        alertClass = "alert-warning";
    } else if (currentWeather.uv < 8) {
        currentWeather.uvAlert = "high";
        alertClass = "alert-danger";
    } else if (currentWeather.uv < 11) {
        currentWeather.uvAlert = "very high";
        alertClass = "alert-danger";
    } else {
        currentWeather.uvAlert = "extreme";
        alertClass = "alert-danger";
    }

    uvAlertEl.textContent = currentWeather.uvAlert;
    uvAlertEl.classList.add(alertClass);
};

// Clears the forecast data from the page and empties the forecast array
var clearForecast = function() {
    forecast = [];
    forecastEl.innerHTML = "";
};

// Allows the user to click on a city listed in the search history and search for that city
var historyClickHandler = function(event) {
    var histCity = event.target.textContent;
    if (histCity) {
        clearForecast();
        getWeather(histCity);
    }
};

// This function clears the data in the results column, hiding the forecast card as well as the card-body of the current weather.
// It also clears all date from the card header other than the name which may be used for other things like displaying error messages.
var clearData = function () {
    console.log("inside clearData");
    curStatsEl.style.display = "none";
    forecastContEl.style.display = "none";
    curDateEl.innerHTML = "";
    curIconEl.innerHTML = "";
}

// Load search history from local storage and display it on the page.
loadHistory();

// Add event listeners to form and buttons
formEl.addEventListener("submit", formSubmitHandler); // Listener for form submission
clearBtnEl.addEventListener("click", clearHistory); // Listener for clear history button
historyEl.addEventListener("click", historyClickHandler); // Listener for clicking on a search history item