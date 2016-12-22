//animation values
var bounceInfinite = "animated infinite bounce";
var fadeOutDown = "animated fadeOutDown";
var bounceOut = "animated bounceOut";
var bounceIn = "animated bounceIn";
var rollOut = "animated rollOut";
var zoomInDown = "animated zoomInDown";
var zoomOut = "animated zoomOut";
//game variables
var questions = null;
var answeredQuestions = [];
var currentUser;
var User = function () {
  // this.id = "00000000-0000-0000-0000-000000000000" //implement later if backend is integrated
  // this.name = "";
  this.name = null;
  this.avatar = null;
  this.highScore = null;
  this.lowScore = null;
  this.inProgress = false;
  this.speed = null;
  this.currentScore = 0;
  this.questions = [];
  this.answeredQuestions = [];
}

//#region Helper Functions
function readTextFile(file, callback) {

    var rawFile = new XMLHttpRequest();
    rawFile.overrideMimeType("application/json");
    rawFile.open("GET", file, true);
    rawFile.onreadystatechange = function() {
        if (rawFile.readyState === 4 && rawFile.status == "200") {
            callback(rawFile.responseText);
        }
    }
    rawFile.send(null);
}

Array.prototype.shuffleArray = function() {

  var array = this;

  var i = 0
    , j = 0
    , temp = null

  for (i = array.length - 1; i > 0; i -= 1) {
    j = Math.floor(Math.random() * (i + 1))
    temp = array[i]
    array[i] = array[j]
    array[j] = temp
  }
  // return array;
}

function animateIn() {
  $(".animate-in-out").addClass(bounceIn);
}

function updateStorage() {
  localStorage.setItem("appUser", JSON.stringify(currentUser));
}

function clearUserState() {
  currentUser.currentScore = 0;
  currentUser.questions = [];
  currentUser.answeredQuestions = [];
}
//#endregion


//#region New User
function newUserState() {

  $.get("/templates/welcome.html", function (data) {
      $("#main-content").empty().append(data);
      animateIn();
      $(".bouncer").hover(function (e) {
        $(e.target).addClass(bounceInfinite);
      }, function (e) {
        $(e.target).removeClass(bounceInfinite);
      });
      $(".bouncer").on("click", function (e) {
        currentUser = new User();
        var target = $(e.target);
        var imgSource = target.prop('src').split("/");
        currentUser.avatar = imgSource[imgSource.length - 2] + "/" + imgSource[imgSource.length - 1];
        // TODO: perhaps remove below closestChild code
        var closestChild = target.closest("div").siblings().find("img");
        target.removeClass(bounceInfinite);
        // closestChild.addClass(fadeOutDown);
        // $('.ftt').addClass('hidden');
        // $('.play-button').removeClass("hidden").on("click", function () {
          $(".animate-in-out").addClass(bounceOut).one("animationend", function () {
            setCardState();
          });
        // });
        closestChild.one("animationend", function () {
          // TODO: center avatar after one fades away
          // target.parent().attr("class", "").addClass("col-md-8");
          closestChild.removeClass(fadeOutDown).addClass("hidden");
        })
      })
  })


}
//#endregion

//#region Previous User State
function prevUserState() {
  currentUser = JSON.parse(localStorage.getItem("appUser"));
  // TODO: check for currentUser.inProgress to see if the game is in progress and show "Continue" button
  console.log(currentUser);
  $.get("/templates/home.html", function (template) {
    $("#main-content").empty().append(template);
    var avatar = $(".avatar");
    avatar.attr("src", currentUser.avatar);
    $("#new-game").on("click", function () {
      console.log('should clear state here');
      clearUserState();
      setCardState();
    });
    if (currentUser.name) $("#user-name").removeClass("hidden");
    if (currentUser.questions.length) {
      $("#resume-game").removeClass("hidden");
      // resumeDiv.child().on("click", function () {
        // console.log('child clicked!!');
      // })
    }
    if (!currentUser.inProgress) {
      $("#recap").removeClass("hidden");
      setTimeout(function () {
        avatar.addClass("animated swing")
      }, 5000);
      avatar.on("click", function () {
        setGameOver();
      })
    }
    animateIn();

  })
}
//#endregion

//#region Main game
function buildCardView(data, newGame) {

  $.get("/templates/game.html", function(template) {
    var selected = null;
    $("#main-content").empty().append(template);
    // TODO: figure out why animateIn isn't working
    // if (newGame) animateIn();
    $("#question").html(data.question);
    data.answers.forEach(function (q) {
      $("#questions").append('<div class="card text-center col-md-6 col-md-offset-3" role="button"><img class="img-responsive" src="assets/answer-unselected.png" alt="answer not selected background"><div class="caption"><p>' + q.answer + '</p></div></div>');
    })
    // TODO: flesh out logic for hover. As it tends to selects different elements depending on where mouse is
    // $(".card").hover(function (e) {
    //   $(e.target).attr("src", "/assets/answer-selected.png");
    // }, function (e) {
    //   if (!selected) $(e.target).attr("src", "/assets/answer-unselected.png");
    // });
    $(".card").on("click", function (e) {
      currentUser.inProgress = true;
      $(".card").css("pointer-events", "none");
      selected = $(".card").index(this);
      data.answered = data.answers[selected];
      data.answered.selectedIndex = selected;
      // NOTE: calculating correct answer up front to reduce heavier calculation at setGameOver();
      data.answers.forEach(function (a, i) {
        if (a.score === 1) data.answered.correctIndex = i;
      })
      answeredQuestions.push(data);
      questions.splice(0, 1);
      var overlay = $(".overlay");
      if (data.answered.score) {
        currentUser.currentScore += data.answered.score;

        overlay.children().attr("src", "/assets/correct-tilt.png");
        overlay.css("display", "block").addClass(zoomInDown).one("animationend", function () {
          $(".animate-in-out").addClass(rollOut).one("animationend", function () {
            setTimeout(function () {
              $('#main-content').empty();
              setCardState();
            }, 1000);
          });
        });

      }
      else {
        overlay.children().attr("src", "/assets/incorrect-tilt.png")
        overlay.css("display", "block").addClass(zoomInDown).one("animationend", function () {
          $(".animate-in-out").addClass(zoomOut).one("animationend", function () {
            setTimeout(function () {
              $('#main-content').empty();
              setCardState();
            }, 1000);
          });
        });
      }
      currentUser.questions = questions;
      currentUser.answeredQuestions = answeredQuestions;
      updateStorage();

    });
  })
}

function setCardState() {

  if (!questions) {
    readTextFile("/json/data.json", function (text) {
      questions = JSON.parse(text)[0].questions;
      questions.shuffleArray();
      buildCardView(questions[0], true);
    })
  }
  else if (questions.length > 0){
    console.log(questions.length);
    buildCardView(questions[0]);
  } else {
    setGameOver()
  }


}

function setGameOver() {

  $.get("/templates/game-over.html", function(template) {
    $("#main-content").empty().append(template);
    currentUser = JSON.parse(localStorage.getItem("appUser"));
    currentUser.inProgress = false;
    if (!currentUser.highScore || currentUser.highScore < currentUser.currentScore) currentUser.highScore = currentUser.currentScore;
    updateStorage();
    $(".score").append('<p> Current: ' + currentUser.currentScore + "/" + answeredQuestions.length + '</p>');
    $(".score").append('<p> Best: ' + currentUser.highScore + "/" + answeredQuestions.length + '</p>');
    $(".avatar").attr("src", currentUser.avatar);
    if (!currentUser.name) {
      $(".no-name").removeClass("hidden");
      // TODO: hide current user name black
    }
    console.log(answeredQuestions);
    answeredQuestions.forEach(function (card, i) {
      $("#recap").append('<div class="row"><div id="card-'+ i +'" class="col-md-8 col-md-offset-2 separator"></div></div>')
      $("#card-" + i).append('<h1>' + card.question + '</h1>')
      card.answers.forEach(function (q, qIndex) {
        var answerImg = '<img class="img-responsive" src="assets/answer-unselected.png" alt="answer not selected image">';
        if (q.score === 1) {
          answerImg = '<img class="img-responsive" src="assets/answer-selected.png" alt="answer selected background">';
        }
        else if (q.score === 0 && card.answered.selectedIndex === qIndex) {
          answerImg = '<img class="img-responsive" src="assets/answer-incorrect.png" alt="answer selected background">';
        }
        $("#card-" + i).append('<div class="card text-center col-md-6 col-md-offset-3">' + answerImg +'<div class="caption"><p>' + q.answer + '</p></div></div>');
      })
    })
  });
}
//#endregion

$(function() {

    if (!localStorage.getItem('appUser')) {
      newUserState();
    }
    else {
      prevUserState();
    }

});

// TODO: once the user picks an avatar, create a user in local storage for them
// localStorage.setItem('testObject', JSON.stringify(testObject));
