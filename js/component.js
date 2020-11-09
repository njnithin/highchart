document.addEventListener("DOMContentLoaded", function() {
  var app = new Vue({
    el: '#app',
    delimiters: ["[[", "]]"],
    name: 'application',
    data: {
      /* Data Storage */
      regionDataFetched: {},
      mapDataFetched: {},
      countryPlotData: [],
      interactiveMapData: [],
      countryChartData: [{
        name: "",
        countries: [],
        data: []
      }],
      chartData: {},
      chartObject: "",
      /* End of Data Storage*/
      /* Filter Settings */
      filterData: {
        "countries": [],
        "indicators": [],
        "year": []
      },
      selectedFilters: {
        "countries": "",
        "indicators": "",
        "year": ""
      },
      /* End of Filter Settings */
      tabSettings: {
        activeTab: 1,
        "tabs": [{
          "text": "Chart",
          "type": "chart",
          "icon": "fa-bar-chart"
        }, {
          "text": "Table",
          "type": "table",
          "icon": "fa-th"
        }, {
          "text": "Map",
          "type": "map",
          "icon": "fa-map-marker"
        }, {
          "text": "Interactive Data Analysis",
          "type": "interactive-data",
          "icon": "fa-support"
        }]
      },
      chartSettings: {
        height: 500,
        type: "column"
      },
      loaderFlag: true,
      showPopupScreen: false,
      sharePopupArea: false
    },
    computed: {
      shareLink: function() {
        var i = 0;
        var selectedFilters = this.selectedFilters;
        var params = "?"
        for (eachItem in selectedFilters) {
          if (selectedFilters.hasOwnProperty(eachItem)) {
            var selectIndex = this.filterData[eachItem].indexOf(selectedFilters[eachItem]);
            params += '&' + eachItem + '=' + selectIndex;
          }
        }
        params += '&' + 'chart_type=' + this.chartSettings.type;
        params += '&' + 'tab_index=' + this.tabSettings.activeTab;
        return window.location.href + params;
      },
      activeChartClass: function() {
        var icon = "";
        if (this.chartSettings.type === 'column') {
          icon = "fa-bar-chart";
        } else if (this.chartSettings.type === 'bar') {
          icon = "fa-align-left";
        } else if (this.chartSettings.type === 'line') {
          icon = "fa-line-chart";
        } else if (this.chartSettings.type === 'area') {
          icon = "fa-area-chart";
        }
        return icon;
      }
    },
    methods: {
      getAllUrlParams: function getAllUrlParams(url) {
        // get query string from url (optional) or window
        var queryString = url ? url.split('?')[1] : window.location.search.slice(1);
        // we'll store the parameters here
        var obj = {};
        // if query string exists
        if (queryString) {
          // stuff after # is not part of query string, so get rid of it
          queryString = queryString.split('#')[0];
          // split our query string into its component parts
          var arr = queryString.split('&');
          for (var i = 0; i < arr.length; i++) {
            // separate the keys and the values
            var a = arr[i].split('=');
            // set parameter name and value (use 'true' if empty)
            var paramName = a[0];
            var paramValue = typeof(a[1]) === 'undefined' ? true : a[1];
            // (optional) keep case consistent
            // paramName = paramName.toLowerCase();
            // if (typeof paramValue === 'string') paramValue = paramValue.toLowerCase();
            // if the paramName ends with square brackets, e.g. colors[] or colors[2]
            if (paramName.match(/\[(\d+)?\]$/)) {
              // create key if it doesn't exist
              var key = paramName.replace(/\[(\d+)?\]/, '');
              if (!obj[key]) obj[key] = [];
              // if it's an indexed array e.g. colors[2]
              if (paramName.match(/\[\d+\]$/)) {
                // get the index value and add the entry at the appropriate position
                var index = /\[(\d+)\]/.exec(paramName)[1];
                obj[key][index] = paramValue;
              } else {
                // otherwise add the value to the end of the array
                obj[key].push(paramValue);
              }
            } else {
              // we're dealing with a string
              if (!obj[paramName]) {
                // if it doesn't exist, create property
                obj[paramName] = paramValue;
              } else if (obj[paramName] && typeof obj[paramName] === 'string') {
                // if property does exist and it's a string, convert it to an array
                obj[paramName] = [obj[paramName]];
                obj[paramName].push(paramValue);
              } else {
                // otherwise add the property
                obj[paramName].push(paramValue);
              }
            }
          }
        }
        return obj;
      },
      /**
       * Set Filter data 
       * This Filter  data is used for other than Interactive data analysis
       */
      filterDataSet: function filterDataSet() {
        var self = this,
          year;
        /* Filter for Chart,Table,Map */
        for (year in self.regionDataFetched) {
          if (self.regionDataFetched.hasOwnProperty(year)) {
            self.filterData["year"].push(year);
            var eachYearData = self.regionDataFetched[year];
            var index = Object.keys(self.regionDataFetched).indexOf(year);
            if (index === 0) {
              self.filterData["indicators"] = eachYearData.indicators;
              self.filterData["countries"] = Object.keys(eachYearData.regions);
            }
          }
        }
        /* Add default Values */
        self.filterData["countries"].unshift("All countries");
        self.selectedFilters["countries"] = self.filterData["countries"][0];
        self.selectedFilters["indicators"] = self.filterData["indicators"][0];
        self.selectedFilters["year"] = self.filterData["year"][self.filterData["year"].length - 1];
        /* End of Filter for Chart,Table,Map */
        /* Filter for Interactive Data Analysis */
        /* End of Filter for Interactive Data Analysis */
      },
      filterFunction: function filterFunction(fullData, activeTab) {
        var self = this,
          yearSelected, regionSelected;
        yearSelected = self.selectedFilters["year"];
        regionSelected = self.selectedFilters["countries"];
        self.countryChartData = [{
          name: "",
          countries: [],
          data: []
        }]
        // self.countryChartData[0]["name"] = self.selectedFilters.indicators;
        var countryData = [];
        var tempChartData = [];
        if (activeTab != 4) { //not Interactive Data Analysis
          var regions = fullData[yearSelected].regions;
          if (regionSelected === "All countries") {
            for (region in regions) {
              if (regions.hasOwnProperty(region)) {
                setCountries(regions[region]["countries"]);
              }
            }
          } else {
            setCountries(regions[regionSelected]["countries"]);
          }
          /* Sort chart Data and push to array */
          tempChartData = tempChartData.sort(sortChartData);
          var i = 0;
          for (i; i < tempChartData.length; i++) {
            self.countryChartData[0]["countries"].push(tempChartData[i]["name"]);
            self.countryChartData[0]["data"].push(tempChartData[i]["value"]);
          }
          /* End  of Sort chart Data and push to array */
          function setCountries(countries) {
            var plotValue;
            for (country in countries) {
              plotValue = 0;
              if (countries.hasOwnProperty(country)) {
                var indicatorIndex = self.filterData["indicators"].indexOf(self.selectedFilters["indicators"]);
                var scoreArray = countries[country]["score"];
                plotValue = scoreArray[indicatorIndex];
                countries[country]["value"] = plotValue;
                countryData.push(countries[country]);
                /* Pushing to temp chart data for sorting it later  */
                tempChartData.push({
                  'name': countries[country]["name"],
                  'value': plotValue
                });
              }
            }
          }

          function sortChartData(a, b) {
            if (a.value < b.value) {
              return -1;
            }
            if (a.value > b.value) {
              return 1;
            }
            return 0;
          }
        } else if (activeTab === 4) { //Interactive Data Analysis
          console.log(fullData, self.interactiveMapData)
          countryData = fullData;
        }
        return countryData;
      },
      rightMenuClick: function rightMenuClick(event) {
        var clicked = jQuery(event.target);
        jQuery('.custom-menu-item.active').removeClass('active');
        clicked.parent().toggleClass('active');
        if (!(clicked.is('.dropdown,.chart-select-menu'))) {
          if (clicked.is('.share,.fa-share-alt')) {
            this.shareClick();
          }
          clicked.parent().siblings().find('.dropdown').slideUp();
          clicked.parent().find('.dropdown').slideToggle();
        }
      },
      changeChart: function changeChart(event, type) {
        this.chartSettings.type = type;
        this.createChart();
        jQuery('.chart-select-menu li.active-item').removeClass('active-item');
        jQuery(event.target).addClass('active-item');
        jQuery('.custom-menu-item .dropdown').slideUp();
      },
      closePopupScreen: function closePopupScreen(event) {
        var clickedClassList = event.target.classList
        if (clickedClassList.contains('popup-screen') || clickedClassList.contains('close-icon')) {
          this.showPopupScreen = false;
          /* Other Flags */
          self.sharePopupArea = false;
        }
      },
      shareClick: function shareClick() {
        var self = this;
        self.sharePopupArea = true;
        self.showPopupScreen = true;
      },
      copyShareLink: function copyShareLink() {
        var shareInput = document.querySelector(".share-input");
        shareInput.select();
        shareInput.blur();
        document.execCommand('copy');
        document.querySelector('.share-chart').classList.add('copy-success');
        setTimeout(function() {
          document.querySelector('.share-chart').classList.remove('copy-success');
        }, 2000);
      },
      setShareURL: function setShareURL() {
        var self = this;
        self.shareURL = window.location.href + "?" + self.selectedFilters.indicators;
      },
      filterChange: function filterChange(event) {
        var self = this;
        // setTimeout(function() {
        self.reinit();
        // }, 1000);
      },
      tabChange: function tabChange(event, index) {
        var self = this;
        var currentTab = self.tabSettings.activeTab;
        self.tabSettings.activeTab = index + 1;
        var changedTab = self.tabSettings.activeTab;
        if (currentTab != changedTab) {
          // setTimeout(function() {
          self.reinit();
          // }, 1000);
        }
      },
      yearSelected: function yearSelected(event, year) {
        var self = this;
        self.selectedFilters.year = year;
        // setTimeout(function() {
        self.reinit();
        // }, 1000);
      },
      reinit: function reinit(currentTab) {
        var self = this;
        var currentTab = self.tabSettings.activeTab;
        self.loaderFlag = true;
        jQuery('.custom-menu-item .dropdown').slideUp();
        setTimeout(function() {
          if (currentTab != 4) {
            self.countryPlotData = self.filterFunction(self.regionDataFetched, self.tabSettings.activeTab);
            if (currentTab === 1) {
              self.createChart();
            } else if (currentTab === 3) {
              self.createMap();
            }
          } else if (currentTab === 4) {
            self.interactiveMapData = self.filterFunction(self.mapDataFetched, self.tabSettings.activeTab);
            self.createInMap();
          }
          self.loaderFlag = false;
        }, 500);
      },
      createChart: function createChart() {
        var self = this;
        self.chartObject = Highcharts.chart('chart-container', {
          chart: self.chartSettings,
          colors: ["#64C5B3"],
          title: {
            text: self.selectedFilters.indicators
          },
          credits: {
            enabled: false
          },
          xAxis: {
            categories: self.countryChartData[0]["countries"]
          },
          yAxis: {
            min: 0,
            title: {
              text: 'Indicators'
            }
          },
          legend: {
            enabled: false
          },
          plotOptions: {
            series: {
              label: {
                connectorAllowed: false
              }
            }
          },
          series: self.countryChartData,
          responsive: {
            rules: [{
              condition: {
                maxWidth: 500
              },
              chartOptions: {
                legend: {
                  layout: 'horizontal',
                  align: 'center',
                  verticalAlign: 'bottom'
                }
              }
            }]
          }
        });
      },
      createMap: function createMap() {
        var self = this;
        // Initiate the chart
        Highcharts.mapChart('map-area', {
          chart: {
            map: 'custom/world',
            margin: [70, 50, 50, 50],
            colors: ["#badbef", "#83c6e1", "#8a9dbf", "#7fb4f4"]
          },
          title: {
            text: self.selectedFilters.indicators
          },
          mapNavigation: {
            enabled: true,
            buttonOptions: {
              verticalAlign: 'top'
            }
          },
          exporting: {
            enabled: false
          },
          credits: {
            enabled: false
          },
          legend: {
            enabled: false
          },
          colorAxis: {
            min: 0,
            // minColor: '#badbef',
            minColor: '#53a5f5',
            maxColor: '#3c7dbc'
          },
          legend: {
            layout: 'horizontal',
            align: 'right',
            verticalAlign: 'bottom'
          },
          tooltip: {
            enabled: window.innerWidth > 1024,
            backgroundColor: "#fff",
            borderWidth: 0,
            borderRadius: 0,
            shadow: false,
            useHTML: true,
            padding: 0,
            style: {
              cursor: 'pointer'
            },
            headerFormat: '',
            hideDelay: 100,
            formatter: function(e) {
              var pouptemp = '<div style="cursor: pointer !important" class="country-name hover-tooltip">' +'<div class="f32"><div class="flag '+this.point.name.replace(/\s+/g, '-').toLowerCase()+'">'+ '</div></div><div class="c-name">' +this.point.name + '</div>' + '<div class="score">' + this.point.value + '</div></div>';
              return pouptemp;
            }
          },
          plotOptions: {
            series: {
              stickyTracking: true,
              events: {
                click: function(e) {}
              },
              point: {
                events: {
                  select: function(e) {},
                  mouseOver: function(e) {},
                  mouseOut: function(e) {}
                }
              }
            }
          },
          series: [{
            data: self.countryPlotData,
            animation: {
              duration: 800
            },
            joinBy: ['name', 'name'],
            name: '',
            // color: '#7fb4f4',
            nullColor: '#eaeaea',
            borderColor: '#cbcbcb',
            states: {
              hover: {
                color: '#3c7dbc'
              }
            },
            shadow: false
          }]
        });
      },
      /* Map for interactive data Analyis*/
      createInMap: function createInMap() {
        var self = this;
        // Initiate the chart
        Highcharts.mapChart('interactive-map-area', {
          chart: {
            map: 'custom/world',
            margin: [70, 50, 50, 50]
          },
          title: {
            text: ''
          },
          mapNavigation: {
            enabled: true,
            buttonOptions: {
              verticalAlign: 'top'
            }
          },
          credits: {
            enabled: false
          },
          legend: {
            enabled: false
          },
          exporting: {
            enabled: false
          },
          tooltip: {
            enabled: window.innerWidth > 1024,
            backgroundColor: "#fff",
            borderWidth: 0,
            borderRadius: 0,
            shadow: false,
            useHTML: true,
            padding: 0,
            style: {
              cursor: 'pointer'
            },
            headerFormat: '',
            hideDelay: 100,
            formatter: function(e) {
              // if (readmorePopupFlag == false) {
              var pouptemp = '<div style="cursor: pointer !important" class="country-name hover-tooltip">' + this.point.name + '</div>';
              return pouptemp;
              // }
            }
          },
          plotOptions: {
            series: {
              stickyTracking: true,
              events: {
                click: function(e) {}
              },
              point: {
                events: {
                  select: function(e) {},
                  mouseOver: function(e) {},
                  mouseOut: function(e) {}
                }
              }
            }
          },
          series: [{
            data: self.interactiveMapData,
            animation: {
              duration: 800
            },
            joinBy: ['iso-a2', 'code'],
            name: '',
            color: '#A91F23',
            nullColor: '#eaeaea',
            borderColor: '#cbcbcb',
            states: {
              hover: {
                color: '#821c1f'
              }
            },
            shadow: false
          }]
        });
      },
      urlCheck: function urlCheck() {
        var params = this.getAllUrlParams(window.location.url);
        if (params.tab_index != undefined) {
          if (params.tab_index == 1) {
            var country = params.countries;
            var indicator = params.indicators;
            var year = params.year;
            var chartType = params.chart_type;
            if (country != undefined) {
              var selectedCountry = this.filterData["countries"][country];
              if (selectedCountry != undefined) {
                this.selectedFilters["countries"] = selectedCountry;
              }
            }
            if (indicator != undefined) {
              var selectedIndicator = this.filterData["indicators"][indicator];
              if (selectedIndicator != undefined) {
                this.selectedFilters["indicators"] = selectedIndicator;
              }
            }
            if (year != undefined) {
              var selectedYear = this.filterData["year"][year];
              if (selectedYear != undefined) {
                this.selectedFilters["year"] = selectedYear;
              }
            }
            if (chartType != undefined) {
              this.chartSettings.type = chartType;
              jQuery('.chart-select-menu li').removeClass('active-item');
              jQuery('.chart-select-menu li[value="'+chartType+ '"').addClass('active-item');
            }
          }
          window.history.pushState("object or string", "Title", window.location.pathname);
        }
      }
    },
    created: function created() {
      var self = this;

      function getRegionData() {
        return axios.get('json/region.json');
      }

      function getMapData() {
        return axios.get('json/map.json');
      }
      axios.all([getRegionData(), getMapData()]).then(function(response) {
        self.regionDataFetched = response[0].data.yeardata;
        self.mapDataFetched = response[1].data;
        self.filterDataSet();
        self.countryPlotData = self.filterFunction(self.regionDataFetched, self.tabSettings.activeTab);
        self.setShareURL();
      });
    },
    mounted: function mounted() {
      var self = this;
      self.loaderFlag = true;
      setTimeout(function() {
        self.urlCheck();
        self.reinit();
      }, 500)
    },
    updated: function updated() {}
  })
});