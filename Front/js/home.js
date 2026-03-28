function loadScript(src) {
    document.querySelectorAll(`script[data-home-dynamic-script="${src}"]`).forEach((script) => {
        script.remove();
    });

    const script = document.createElement("script");
    const separator = src.includes("?") ? "&" : "?";
    script.src = `${src}${separator}v=${Date.now()}`;
    script.dataset.homeDynamicScript = src;
    document.body.appendChild(script);
}

loadScript("/EcoRide/Front/js/avis/avis.js");
loadScript("/EcoRide/Front/js/newsletter/newsletter.js");
loadScript("/EcoRide/Front/js/trajets/trajets-populaires.js");
loadScript("/EcoRide/Front/js/covoiturages/home-search.js");
loadScript("/EcoRide/Front/js/admin/home-admin-media.js");
