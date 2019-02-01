var videoContent = document.getElementById('video-element');
var adsManager;

var adDisplayContainer =
  new google.ima.AdDisplayContainer(
    document.getElementById('ad-container'),
    videoContent);
// Must be done as the result of a user action on mobile
adDisplayContainer.initialize();

// Re-use this AdsLoader instance for the entire lifecycle of your page.
var adsLoader = new google.ima.AdsLoader(adDisplayContainer);

// Add event listeners
adsLoader.addEventListener(
  google.ima.AdsManagerLoadedEvent.Type.ADS_MANAGER_LOADED,
  onAdsManagerLoaded,
  false);
adsLoader.addEventListener(
  google.ima.AdErrorEvent.Type.AD_ERROR,
  onAdError,
  false);

function onAdError(adErrorEvent) {
  // Handle the error logging and destroy the AdsManager
  console.log(adErrorEvent.getError());
  adsManager.destroy();
}

// An event listener to tell the SDK that our content video
// is completed so the SDK can play any post-roll ads.
var contentEndedListener = function () { adsLoader.contentComplete(); };
videoContent.onended = contentEndedListener;

// Request video ads.
var adsRequest = new google.ima.AdsRequest();
adsRequest.adTagUrl = 'https://pubads.g.doubleclick.net/gampad/ads?' +
  'sz=640x480&iu=/124319096/external/single_ad_samples&ciu_szs=300x250&' +
  'impl=s&gdfp_req=1&env=vp&output=vast&unviewed_position_start=1&' +
  'cust_params=deployment%3Ddevsite%26sample_ct%3Dlinear&correlator='

// Specify the linear and nonlinear slot sizes. This helps the SDK to
// select the correct creative if multiple are returned.
adsRequest.linearAdSlotWidth = 640;
adsRequest.linearAdSlotHeight = 360;
adsRequest.nonLinearAdSlotWidth = 640;
adsRequest.nonLinearAdSlotHeight = 120;

function onAdsManagerLoaded(adsManagerLoadedEvent) {
  // Get the ads manager.
  adsManager = adsManagerLoadedEvent.getAdsManager(videoContent);  // See API reference for contentPlayback

  // Add listeners to the required events.
  adsManager.addEventListener(
    google.ima.AdErrorEvent.Type.AD_ERROR,
    onAdError);
  adsManager.addEventListener(
    google.ima.AdEvent.Type.CONTENT_PAUSE_REQUESTED,
    onContentPauseRequested);
  adsManager.addEventListener(
    google.ima.AdEvent.Type.CONTENT_RESUME_REQUESTED,
    onContentResumeRequested);

  try {
    // Initialize the ads manager. Ad rules playlist will start at this time.
    adsManager.init(640, 360, google.ima.ViewMode.NORMAL);
    // Call start to show ads. Single video and overlay ads will
    // start at this time; this call will be ignored for ad rules, as ad rules
    // ads start when the adsManager is initialized.
    adsManager.start();
  } catch (adError) {
    // An error may be thrown if there was a problem with the VAST response.
    // Play content here, because we won't be getting an ad.
    videoContent.play();
  }
}

adsLoader.requestAds(adsRequest);

adBtnPlayPause = document.getElementById('ad-btnPlayPause');
adBtnMute = document.getElementById('ad-btnMute');
adProgressBar = document.getElementById('ad-progress-bar');
adVolumeBar = document.getElementById('ad-volume-bar');

var duration = undefined;
countdownTimer = setInterval(function () {
  if (adsManager) {
    var timeRemaining = adsManager.getRemainingTime();
    if (!duration && timeRemaining > 0) {
      duration = timeRemaining;
    }
    if (adsManager.getVolume() === 0) {
      changeButtonType(adBtnMute, 'unmute');
    }
    var percent = (1.0 - timeRemaining / duration) * 100;
    adProgressBar.value = percent;
    adProgressBar.innerHTML = percent + '% played';
    console.log(timeRemaining);
  }
}, 50);

var paused = false;
changeButtonType(adBtnPlayPause, 'pause');
function playPauseAdVideo() {
  if (paused) {
    adsManager.resume();
    changeButtonType(adBtnPlayPause, 'pause');
  } else {
    adsManager.pause();
    changeButtonType(adBtnPlayPause, 'play');
  }
  paused = !paused;
}

function changeButtonType(btn, value) {
  btn.title = value;
  btn.innerHTML = value;
  btn.className = value;
}

function replayAdVideo() {
  adsManager.start();
  paused = false;
  changeButtonType(adBtnPlayPause, 'pause');
}

function stopAdVideo() {
  adsManager.stop();
}

function muteAdVolume() {
  if (adsManager.getVolume() === 0) {
    // Change the button to a mute button
    changeButtonType(adBtnMute, 'mute');
    adsManager.setVolume(1);
  }
  else {
    // Change the button to an unmute button
    changeButtonType(adBtnMute, 'unmute');
    adsManager.setVolume(0);
  }
}

function onContentPauseRequested() {
  // This function is where you should setup UI for showing ads (e.g.
  // display ad timer countdown, disable seeking, etc.)
  videoContent.removeEventListener('ended', contentEndedListener);
  videoContent.pause();
}

function onContentResumeRequested() {
  // This function is where you should ensure that your UI is ready
  // to play content.
  document.getElementById('ad-wrapper').style.display = "none";
  document.getElementById('content-wrapper').style.display = "block";
  videoContent.addEventListener('ended', contentEndedListener);
  clearInterval(countdownTimer);
  videoContent.play();
}
