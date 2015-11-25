//global variable declarations

//Variable for use in objects from get requests
var totalSessionsPlayed = 'totalSessionsPlayed';
var totalGoldEarned = 'totalGoldEarned';
var totalChampionKills = 'totalChampionKills';
var totalDeathsPerSession = 'totalDeathsPerSession';
var totalAssists = 'totalAssists';
var champImage = 'image';
var champImageType = 'full';
var getChampId = 'id';

//User variables
var avgMatchLengthUser;
var avgGoldPerMatchUser;
var avgKillsPerMatchUser;
var avgAssistsPerMatchUser;
var avgDeathsPerMatchUser;
var userRole;
var summonerNameAsEntered;
var summonerName;
var mostPlayedChamp;

//Jquery Locations
var $again;
var $userStats = $('.userStats');
var $proStats = $('.proStats');

//Adds the last search in as the value of the input
if (localStorage.getItem("lastSearch")) {
  $('#summonerName')[0].value = localStorage.getItem("lastSearch");
}

//Buttons for selecting roles
$('#top').on('click', function(event) {
  event.preventDefault();
  userRole = 'top';
});
$('#jungle').on('click', function(event) {
  event.preventDefault();
  userRole = 'jungle';
});
$('#mid').on('click', function(event) {
  event.preventDefault();
  userRole = 'mid';
});
$('#adc').on('click', function(event) {
  event.preventDefault();
  userRole = 'adc';
});
$('#support').on('click', function(event) {
  event.preventDefault();
  userRole = 'support';
});

//Click event for submitting username
$('#submitName').on('click', function(event) {
  event.preventDefault();
  if (!userRole) {
    alert('You did not select a role.');
  } else {
    callsummonerRequest();
  }
});

//Event to stop the page from reloading on form submission
$('form').submit(function(event) {
  event.preventDefault();
});

//Sends a get request for a summoner name in order to get the summoner id
function callsummonerRequest() {
  //Used for recalling the way the Summoner Name was typed
  summonerNameAsEntered = $('#summonerName')[0].value;

  //Adds the Summoner Name to local storage
  localStorage.setItem('lastSearch', summonerNameAsEntered);

  //Sets the user's Summoner Name to the value of the Summoner Name input and normalizes it
  summonerName = $('#summonerName')[0].value.toLowerCase().toString().replace(/\s/g, '');

  summonerRequest = new XMLHttpRequest();
  summonerRequest.onreadystatechange = function(){
    if(this.readyState === 4 && this.status < 400) {
      var summonerId = JSON.parse(this.responseText)[summonerName].id;

      callsummonerStats(summonerId);

      matchList(summonerId);
    }
  };
  summonerRequest.open('GET', 'https://na.api.pvp.net/api/lol/na/v1.4/summoner/by-name/' + summonerName + '?api_key=1ea122ac-f547-4936-a798-641813065ade');
  summonerRequest.send();
}

//Sends a get request for stats on a specific summoner id
function callsummonerStats(summonerId) {
  summonerStats = new XMLHttpRequest();
  summonerStats.onreadystatechange = function(){
    if(this.readyState === 4 && this.status < 400) {
      var rawStats = JSON.parse(this.responseText);

      parseChamps(rawStats);
    }
  };
  summonerStats.open('GET', 'https://na.api.pvp.net/api/lol/na/v1.3/stats/by-summoner/' + summonerId + '/ranked?api_key=1ea122ac-f547-4936-a798-641813065ade');
  summonerStats.send();
}

//Parse through the champions played by the user to output compiled statistics
function parseChamps(rawStats) {
  var statsPerChamp = rawStats.champions;

  //Calculates average gold per match
  avgGoldPerMatchUser = totalStats(statsPerChamp, totalGoldEarned)/totalStats(statsPerChamp, totalSessionsPlayed);

  //Calculates average kills per match
  avgKillsPerMatchUser = (totalStats(statsPerChamp, totalChampionKills) / totalStats(statsPerChamp, totalSessionsPlayed));

  //Calculates average deaths per match
  avgDeathsPerMatchUser = (totalStats(statsPerChamp, totalDeathsPerSession)/totalStats(statsPerChamp, totalSessionsPlayed));

  //Calculates average assists per match
  avgAssistsPerMatchUser = (totalStats(statsPerChamp, totalAssists)/totalStats(statsPerChamp, totalSessionsPlayed));
}

//Totals stats from callsummonerStats()
function totalStats(statsPerChamp, statToTotal) {
  var total = 0;
  var gamesPerChamp = 0;

  for (var i = 0; i < statsPerChamp.length; i++) {
    if (statsPerChamp[i][getChampId] !== 0) {
      total = total + statsPerChamp[i].stats[statToTotal];

      //Sets the most played champion
      if (statsPerChamp[i].stats[totalSessionsPlayed] > gamesPerChamp) {
        gamesPerChamp = statsPerChamp[i].stats[totalSessionsPlayed];
        mostPlayedChamp = statsPerChamp[i][getChampId];
      }
    }
  }
  return total;
}

//Sends a get request for stats on a specific summoner id
function matchList(summonerId) {
  summonerStats = new XMLHttpRequest();
  summonerStats.onreadystatechange = function(){
    if(this.readyState === 4 && this.status < 400) {
      var rawStats = JSON.parse(this.responseText);
      var matchLengthArray = [];
      for (var i = 1; i<7; i++) {
        var matchId = rawStats.matches[rawStats.matches.length-i].matchId;
        parseMatches(matchId, matchLengthArray);
      }
      //Used to break out of the loop in parseMatches()
      var l = 0;
      parseMatches(rawStats.matches[rawStats.matches.length-7].matchId, matchLengthArray, l);
    }
  };
  summonerStats.open('GET', 'https://na.api.pvp.net/api/lol/na/v2.2/matchlist/by-summoner/' + summonerId + '?api_key=1ea122ac-f547-4936-a798-641813065ade');
  summonerStats.send();
}

//Parses Matches with Match Ids
function parseMatches(matchId, matchLengthArray, x) {
  matchDataset = new XMLHttpRequest();
  matchDataset.onreadystatechange = function(){
  if(this.readyState === 4 && this.status < 400) {
    var rawStats = JSON.parse(this.responseText);

    matchLengthArray.push(rawStats.matchDuration);
    
    //Checks if the match is the last in the array
    if (x === 0) {
      matchLengthTotal = matchLengthArray.reduce(function(prev, curr) {
        return prev + curr;
      });

      //calculates the average match length in minutes
      avgMatchLengthUser = (matchLengthTotal/matchLengthArray.length/60);

      printStatsToPage($userStats);
    }
  }
};
matchDataset.open('GET', 'https://na.api.pvp.net/api/lol/na/v2.2/match/' + matchId + '?api_key=1ea122ac-f547-4936-a798-641813065ade');
matchDataset.send();
}

//Prints the user's stats to the page
function printStatsToPage(userOrPro) {

  userOrPro.append( '<h4>' + summonerNameAsEntered +'</h4>' );

  //Calculates Kill/Death Ratio and prints it to the page
  userOrPro.append( '<p>' + (Math.round( (avgKillsPerMatchUser+avgAssistsPerMatchUser) / avgDeathsPerMatchUser * 10) / 10) + '</p>' );

  //Prints average kills per match to the page
  userOrPro.append( '<p>' + Math.round(avgKillsPerMatchUser) + '</p>' );

  //Prints average assists per match to the page
  userOrPro.append( '<p>' + Math.round(avgAssistsPerMatchUser) + '</p>' );

  //Prints average deaths per match to the page
  userOrPro.append( '<p>' + Math.round(avgDeathsPerMatchUser) + '</p>' );

  //Calculates average Gold per minute and prints it to the page
  userOrPro.append( '<p>' + Math.round(avgGoldPerMatchUser/avgMatchLengthUser ) + '</p>' );

  //Prints average gold per match to the page
  userOrPro.append( '<p>' + Math.round(avgGoldPerMatchUser) + '</p>' );

  getChampName(mostPlayedChamp);

  printStatsToPagePro(userRole);

  //Removes old page content and adds new page content
  $('#submitName').remove();
  if ($('section button:last-child').text() === 'Again?') {
    //turns the click listener for again off until the time limit is up
    $('#again').off('click mouseenter mouseleave');
  } else {
    $('section').append('<button id="again" class="col-md-offset-1 col-md-1 green again">Again?</button>');
  }

  //Makes the again button inaccessible for 10sec
  $again = $('#again');
  $again.css('width', '17rem');
  $again.css('height', '9rem');
  $again.css('background-color', '#BDBDBD');
  $again.text('please wait...');
  $('section').css('opacity', 1);
  var timeoutID = window.setTimeout(allowPress, 10001);
}

//Adds a click event for the Again? button to check another summoner name
function allowPress() {
  $again.css('width', '16rem');
  $again.css('height', '8rem');

  //Sets hover for the again button
  $(function() {
    $again.hover(function () {
      $again.css('width', '17rem');
      $again.css('height', '9rem');
    }, function() {
        $again.css('width', '16rem');
        $again.css('height', '8rem');
    });
  });

  //Resets color and text
  $again.css('background-color', '#00C853');
  $again.text('Again?');

  //Makes the again button clickable again
  $again.click(function() {
     event.preventDefault();
    var test = document.querySelectorAll('p');
    $('section div').last().empty();
    $('section div:nth-last-child(3)').empty();
    $('section').css('opacity', 0);
    for (i = 6; i < test.length; i++) {
      test[i].innerHTML = '';
    }
    if (!userRole) {
      alert('You did not select a role.');
    } else {
      callsummonerRequest();
    }
  });
}


//Prints the pro's stats to the page
function printStatsToPagePro(role) {
  if (role === 'top') {
    $proStats.append( '<h4>Dyrus</h4>' );
    for (var dyrusKey in proStats.dyrus) {
      $proStats.append( '<p>' + proStats.dyrus[dyrusKey] + '</p>' );
    }
    $proStats.append('<img src="http://ddragon.leagueoflegends.com/cdn/4.4.3/img/champion/Rumble.png"/>');
  } else if (role === 'jungle') {
    $proStats.append( '<h4>C9 Meteos</h4>' );
    for (var meteosKey in proStats.meteos) {
      $proStats.append( '<p>' + proStats.meteos[meteosKey] + '</p>' );
    }
    $proStats.append('<img src="http://ddragon.leagueoflegends.com/cdn/4.4.3/img/champion/Nidalee.png"/>');
  } else if (role === 'mid') {
    $proStats.append( '<h4>Scarra</h4>' );
    for (var scarraKey in proStats.scarra) {
      $proStats.append( '<p>' + proStats.scarra[scarraKey] + '</p>' );
    }
    $proStats.append('<img src="http://ddragon.leagueoflegends.com/cdn/4.4.3/img/champion/Vayne.png"/>');
  } else if (role === 'adc') {
    $proStats.append( '<h4>C9 Sneaky</h4>' );
    for (var sneakyKey in proStats.sneaky) {
      $proStats.append( '<p>' + proStats.sneaky[sneakyKey] + '</p>' );
    }
    $proStats.append('<img src="http://ddragon.leagueoflegends.com/cdn/4.4.3/img/champion/Lucian.png"/>');
  } else if (role === 'support') {
    $proStats.append( '<h4>C9 Bunny Fufuu</h4>' );
    for (var bunnyKey in proStats.bunny) {
      $proStats.append( '<p>' + proStats.bunny[bunnyKey] + '</p>' );
    }
    $proStats.append('<img src="http://ddragon.leagueoflegends.com/cdn/4.4.3/img/champion/Thresh.png"/>');
  }
}

//Makes a get request with the most played champion to gt its pictures name
function getChampName(champId) {
  summonerStats = new XMLHttpRequest();
  summonerStats.onreadystatechange = function(){
    if(this.readyState === 4 && this.status < 400) {
      var rawStats = JSON.parse(this.responseText);
      var champPicture = rawStats[champImage][champImageType];
      getChampSprite(champPicture);
    }
  };
  summonerStats.open('GET', 'https://global.api.pvp.net/api/lol/static-data/na/v1.2/champion/' + champId + '?champData=image&api_key=1ea122ac-f547-4936-a798-641813065ade');
  summonerStats.send();
}

//Adds the most played champion to the page and reveals content
function getChampSprite(picture) {
  //Adds the most played champion to the page
  $userStats.append('<img src="http://ddragon.leagueoflegends.com/cdn/4.4.3/img/champion/' + picture + '"/>');

  //Reveals content
  $proStats.css('opacity', 1);
  $userStats.css('opacity', 1);
  $('.labels').css('opacity', 1);
}
