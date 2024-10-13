const lightbox = GLightbox();
const lightboxVideo = GLightbox({
  selector: ".glightbox3",
  touchNavigation: false,
  plyr: {
    config: {
      ratio: "9:16",
    },
  },
});
lightbox.on("open", (target) => {
  console.log("lightbox opened");
});
const apiUrl = "/api/new_media";
$.getJSON(apiUrl, (data) => {
  data.forEach((d, i) => {
    const newMedia = d.newMedia;
    const section = `<div id="section-${i}"></div>`;
    $("#container").append(section);
    for (const nm of newMedia) {
      if (nm.type === "photo") {
        const imgElement = `
        <a href="${nm.media}" class="glightbox">
            <img src="${nm.media}" id="photo" alt="image" loading="lazy"/>
        </a>`;
        $(`#section-${i}`).append(imgElement);
      } else {
        const videoElement = `
        <a href="${nm.media}" class="glightbox3" data-glightbox="type: video">
            <img src="${nm.thumb}" id="photo" alt="image" loading="lazy"/>
        </a>
        <div style="position: absolute;top: 50%;left: 50%;transform: translate(-50%, -50%);">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
                    data-slot="icon" style="width: 48px;" fill="#ffffff90">
                <path fill-rule="evenodd"
                        d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653Z"
                        clip-rule="evenodd"/>
            </svg>
        </div>`;
        $(`#section-${i}`).append(videoElement);
      }
    }
  });
  lightbox.init();
  lightboxVideo.init();
}).fail(() => {
  console.error("Failed to fetch images.");
});
