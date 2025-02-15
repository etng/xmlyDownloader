$(document).ready(function () {

  // 点击获取单个音频
  // https://www.ximalaya.com/gerenchengzhang/19790718/152523144
  $("#getSingleAudioBtn").click(function () {
    chrome.tabs.getSelected(null, function (tab) {
      const url = tab.url;

      const params = url.split("/");
      const trackId = params[params.length - 1];
      console.log(`trackId=${trackId}`);

      const dataUrl = `https://www.ximalaya.com/revision/play/v1/audio?id=${trackId}&ptype=1`;
      $.get(`https://www.ximalaya.com/revision/play/v1/show?id=${trackId}&sort=1&size=30&ptype=1`, function(result){
        var currentTrack = null
        result.data.tracksAudioPlay.forEach(track => {
          if(track.trackId==trackId){
            currentTrack = track
          }
        });
        if(currentTrack){
          $.get(dataUrl, function (result) {
            const title = currentTrack.trackName;
            const audioSrc = result.data.src;
            console.log(`audioSrc:${audioSrc}`);
            $("#sigleAudioRecognizeResult").html(
              `<div><h6>${title}</h6></div>
              <div><button id="downloadAudioBtn" type="button" class="btn btn-link" >下载音频</button></div>`
            );
            $('#downloadAudioBtn').click(function(e) {
              downloadFile(audioSrc, `${title}`);
            })
          });
        }
      })

    });
  });
  function getAlbumTracks(albumId, total, done){
    var pageSize = 100
    var pageNum = 1
    var tracks = []
    var fetchNext = function(){
      $.get(`https://www.ximalaya.com/revision/album/v1/getTracksList?albumId=${albumId}&pageNum=${pageNum}&sort=0&pageSize=${pageSize}`, function (result) {
        var newTracks = result.data.tracks || [];
        if (newTracks.length>0){
          pageNum += 1
          tracks = tracks.concat(newTracks)
          fetchNext()
        } else {
          console.log(`total: ${total} got: ${tracks.length}`)
          done(tracks)
        }
      })
    }
    fetchNext()
  }
  // 点击获取专辑
  // https://www.ximalaya.com/gerenchengzhang/19790718/
  $("#getAlbumAudioBtn").click(function () {
    chrome.tabs.getSelected(null, function (tab) {
      const url = tab.url;
      var page = 1
      var albumId = ''
      const params = url.split("/");
      albumId = params[params.length - 2];
      if(albumId.indexOf('p')==0){
        page = parseInt(albumId.substr(1))
        albumId = params[params.length - 3];
      }
      console.log(`albumId=${albumId} page=${page}`);
      let albumUrl = `https://www.ximalaya.com/revision/album/v1/getTracksList?albumId=${albumId}&pageNum=1&pageSize=1`
      console.log(albumUrl)
      $.get(albumUrl, function (tempRes) {
        const count = tempRes.data.trackTotalCount;
        getAlbumTracks(albumId, count, function(tracks){
          const tbody = tracks.map((t, index) => {
            return `
            <tr class="table-download-row">
              <td>${index + 1}</td>
              <td>${t.title}</td>
              <td class="table-download-col"><button id="${t.trackId}" name="${t.title}" type="button" class="table-download-btn btn btn-link btn-sm">下载</button></td>
            </tr>
            `
          }).join('');
          $("#albumAudioRecognizeResult").html(
            `
            <div><button id="downloadAllBtn" type="button" class="btn btn-link btn-sm" >点击下载整张专辑音频</button></div>
            <table class="table table-hover table-sm">
              <thead class="thead-inverse">
                <tr>
                  <th>#</th>
                  <th>音频名称</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
              ${tbody}
              </tbody>
           </table>
            `
          );
          $('#albumAudioRecognizeAlerts').click(function() {
            $('#albumAudioRecognizeAlerts').html('');
          })
          $('#downloadAllBtn').click(async function(e) {
            for (let index = 0; index < tracks.length; index++) {
              const track = tracks[index];
              const trackId = track.trackId;
              const dataUrl = `https://www.ximalaya.com/revision/play/v1/audio?id=${trackId}&ptype=1`;
              $.get(dataUrl, function (result) {
                const title = track.title;
                const audioSrc = result.data.src;
                downloadFile(audioSrc, `${index + 1}-${title}`);
                $('#albumAudioRecognizeAlerts').html(`<div class="alerts">开始下载-${index + 1}-${title}</div>`)
              });
              await sleep(1000);
            }

            $('#albumAudioRecognizeAlerts').html(`<div class="alerts">专辑音频全部下载完成</div>`);
          })
        })
      })
    });
  });

});


// 下载
// @param  {String} url 目标文件地址
// @param  {String} filename 想要保存的文件名称
function downloadFile(url, filename) {
  console.log('downloadFile', url, filename);
  getBlob(url, function (blob) {
    saveAs(blob, filename);
  });
}
function getBlob(url, cb) {
  var xhr = new XMLHttpRequest();
  xhr.open("GET", url, true);
  xhr.responseType = "blob";
  xhr.onload = function () {
    if (xhr.status === 200) {
      cb(xhr.response);
    }
  };
  xhr.send();
}
// 保存
// @param  {Blob} blob
// @param  {String} filename 想要保存的文件名称
function saveAs(blob, filename) {
  var link = document.createElement("a");
  var body = document.querySelector("body");

  link.href = window.URL.createObjectURL(blob);
  link.download = filename;

  // fix Firefox
  link.style.display = "none";
  body.appendChild(link);

  link.click();
  body.removeChild(link);

  window.URL.revokeObjectURL(link.href);
}

function sleep (time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}