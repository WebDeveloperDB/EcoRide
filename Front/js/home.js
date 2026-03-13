function loadScript(src) {
    if (document.querySelector(`script[src="${src}"]`)) {
        return;
    }
    const script = document.createElement("script");
    script.src = src;
    document.body.appendChild(script);
}

loadScript("/EcoRide/Front/js/avis/avis.js");
loadScript("/EcoRide/Front/js/newsletter/newsletter.js");
loadScript("/EcoRide/Front/js/trajets/trajets-populaires.js");
loadScript("/EcoRide/Front/js/covoiturages/home-search.js");
