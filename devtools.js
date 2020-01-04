// devtools-detect runs a setInterval which is gross
// Copied the non setInterval parts from
// https://raw.githubusercontent.com/sindresorhus/devtools-detect/master/index.js
// Licenced MIT is the same as the rest of this project
var devtools = {
    threshold: 160,
    get open() {
        with (this) {
            widthThreshold = (window.outerWidth - window.innerWidth) > threshold;
            heightThreshold = (window.outerHeight - window.innerHeight) > threshold;
            orientation = widthThreshold ? 'vertical' : 'horizontal'
            _open = (
                !(heightThreshold && widthThreshold) &&
                (
                  (window.Firebug && window.Firebug.chrome && window.Firebug.chrome.isInitialized)
                  || widthThreshold || heightThreshold
                )
            );
            orientation = _open ? orientation : 'undefined';
            return _open;
        }
    }
};