/* eslint-disable no-var, one-var, vars-on-top, prefer-arrow-callback, func-names, prefer-destructuring, no-console, no-alert, prefer-template */

import d3 from "d3";

var doctype = '<?xml version="1.0" standalone="no"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">';

window.URL = (window.URL || window.webkitURL);

var body = document.body,
    emptySvg;

var prefix = {
    xmlns: "http://www.w3.org/2000/xmlns/",
    xlink: "http://www.w3.org/1999/xlink",
    svg: "http://www.w3.org/2000/svg"
};

function _cleanup() {
    var crowbarElements = document.querySelectorAll(".svg-crowbar");

    [].forEach.call(crowbarElements, function (el) {
        el.parentNode.removeChild(el);
    });
}

function _getFontName(fontWeight) {
    var fontName = "NYTFranklin";
    if (fontWeight === 300 || fontWeight.toLowerCase() === "light") {
        return fontName + " Light";
    }
    if (fontWeight > 400 || fontWeight.toLowerCase() === "bold") {
        return fontName + " Bold";
    }
    return fontName + " Medium";
}

function _setInlineStyles(svg, emptySvgDeclarationComputed) {
    function _explicitlySetStyle(element) {
        var cSSStyleDeclarationComputed = getComputedStyle(element);
        var i,
            len,
            key,
            value;
        var computedStyleStr = "";
        for (i = 0, len = cSSStyleDeclarationComputed.length; i < len; i += 1) {
            key = cSSStyleDeclarationComputed[i];
            value = cSSStyleDeclarationComputed.getPropertyValue(key);
            if (value !== emptySvgDeclarationComputed.getPropertyValue(key) && key !== "font-family") {
                computedStyleStr += key + ":" + value + ";";
            }
        }
        if (element.tagName === "text" || element.tagName === "tspan") {
            computedStyleStr += "font-size:" + cSSStyleDeclarationComputed.fontSize + ";";
            var fw = cSSStyleDeclarationComputed.fontWeight,
                ff = _getFontName(fw);
            computedStyleStr += "font-family:" + ff + ";";
        }
        element.setAttribute("style", computedStyleStr);
    }

    function _traverse(obj) {
        var tree = [];
        tree.push(obj);

        function visit(node) {
            if (node && node.hasChildNodes()) {
                var child = node.firstChild;
                while (child) {
                    if (child.nodeType === 1 && child.nodeName !== "SCRIPT") {
                        tree.push(child);
                        visit(child);
                    }
                    child = child.nextSibling;
                }
            }
        }

        visit(obj);
        return tree;
    }
    // hardcode computed css styles inside svg
    var allElements = _traverse(svg);
    var i = allElements.length;
    while (i) {
        _explicitlySetStyle(allElements[i]);
        i -= 1;
    }
}

function _getSources(doc, emptySvgDeclarationComputed) {
    var svgInfo = [],
        svgs = doc.querySelectorAll("svg");

    [].forEach.call(svgs, function (svg) {
        svg.setAttribute("version", "1.1");

        // removing attributes so they aren't doubled up
        svg.removeAttribute("xmlns");
        svg.removeAttribute("xlink");

        // These are needed for the svg
        if (!svg.hasAttributeNS(prefix.xmlns, "xmlns")) {
            svg.setAttributeNS(prefix.xmlns, "xmlns", prefix.svg);
        }

        if (!svg.hasAttributeNS(prefix.xmlns, "xmlns:xlink")) {
            svg.setAttributeNS(prefix.xmlns, "xmlns:xlink", prefix.xlink);
        }

        _setInlineStyles(svg, emptySvgDeclarationComputed);

        var source = (new XMLSerializer()).serializeToString(svg);
        var rect = svg.getBoundingClientRect();
        svgInfo.push({
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
            class: svg.getAttribute("class"),
            id: svg.getAttribute("id"),
            childElementCount: svg.childElementCount,
            source: [doctype + source]
        });
    });
    return svgInfo;
}

function download(source) {
    console.log("Using Download SVG");
    var filename = "untitled";

    if (source.id) {
        filename = source.id;
    } else if (source.class) {
        filename = source.class;
    } else if (window.document.title) {
        filename = window.document.title.replace(/[^a-z0-9]/gi, "-").toLowerCase();
    }

    var url = window.URL.createObjectURL(new Blob(source.source, {
        type: "text/xml"
    }));

    var a = document.createElement("a");
    body.appendChild(a);
    a.setAttribute("class", "svg-crowbar");
    a.setAttribute("download", filename + ".svg");
    a.setAttribute("href", url);
    a.style.display = "none";
    a.click();

    setTimeout(function () {
        window.URL.revokeObjectURL(url);
    }, 10);
}

function downloadPNG(source) {
    console.log("Using Download PNG");
    var filename = "untitled";

    if (source.id) {
        filename = source.id;
    } else if (source.class) {
        filename = source.class;
    } else if (window.document.title) {
        filename = window.document.title.replace(/[^a-z0-9]/gi, "-").toLowerCase();
    }

    var canvas = document.createElement("canvas");
    body.appendChild(canvas);
    canvas.setAttribute("id", "svg-image");
    canvas.setAttribute("width", source.width);
    canvas.setAttribute("height", source.height);
    canvas.style.display = "none";

    var canvasSvgImage = document.querySelector("canvas#svg-image"),
        context = canvasSvgImage.getContext("2d");
    var imgsrc = "data:image/svg+xml;base64," + btoa(source.source);

    var image = new Image();
    image.src = imgsrc;
    image.onload = function () {
        context.drawImage(image, 0, 0);
        var canvasdata = canvas.toDataURL("image/png");
        // var canvasdata = canvas.toDataURL("image/svg+xml;base64");

        var pngimg = '<img src="' + canvasdata + '" width="' + source.width + '" height="' + source.height + '">';
        d3.select("#pngdataurl").html(pngimg);

        var a = document.createElement("a");
        a.download = filename + ".png";
        // a.download = "sample.svg";
        a.href = canvasdata;
        document.body.appendChild(a);
        a.click();
    };
}

function createPopover(sources) {
    _cleanup();

    sources.forEach(function (s1) {
        sources.forEach(function (s2) {
            if (s1 !== s2) {
                if ((Math.abs(s1.top - s2.top) < 38) && (Math.abs(s1.left - s2.left) < 38)) {
                    s2.top += 38;
                    s2.left += 38;
                }
            }
        });
    });

    var buttonsContainer = document.createElement("div");
    body.appendChild(buttonsContainer);

    buttonsContainer.setAttribute("class", "svg-crowbar");
    buttonsContainer.style["z-index"] = 1e7;
    buttonsContainer.style.position = "absolute";
    buttonsContainer.style.top = 0;
    buttonsContainer.style.left = 0;

    var background = document.createElement("div");
    body.appendChild(background);

    background.setAttribute("class", "svg-crowbar");
    background.style.background = "rgba(255, 255, 255, 0.7)";
    background.style.position = "fixed";
    background.style.left = 0;
    background.style.top = 0;
    background.style.width = "100%";
    background.style.height = "100%";

    sources.forEach(function (d, i) {
        var buttonWrapper = document.createElement("div");
        buttonsContainer.appendChild(buttonWrapper);
        buttonWrapper.setAttribute("class", "svg-crowbar");
        buttonWrapper.style.position = "absolute";
        buttonWrapper.style.top = (d.top + document.body.scrollTop) + "px";
        buttonWrapper.style.left = (document.body.scrollLeft + d.left) + "px";
        buttonWrapper.style.padding = "4px";
        buttonWrapper.style["border-radius"] = "3px";
        buttonWrapper.style.color = "white";
        buttonWrapper.style["text-align"] = "center";
        buttonWrapper.style["font-family"] = "'Helvetica Neue'";
        buttonWrapper.style.background = "rgba(0, 0, 0, 0.8)";
        buttonWrapper.style["box-shadow"] = "0px 4px 18px rgba(0, 0, 0, 0.4)";
        buttonWrapper.style.cursor = "move";
        buttonWrapper.textContent = "SVG #" + i + ": " + (d.id ? "#" + d.id : "") + (d.class ? "." + d.class : "");

        var button = document.createElement("button");
        buttonWrapper.appendChild(button);
        button.setAttribute("data-source-id", i);
        button.style.width = "150px";
        button.style["font-size"] = "12px";
        button.style["line-height"] = "1.4em";
        button.style.margin = "5px 0 0 0";
        button.textContent = "Download SVG";

        var buttonPNG = document.createElement("button");
        buttonWrapper.appendChild(buttonPNG);
        buttonPNG.setAttribute("data-source-id", i);
        buttonPNG.style.width = "150px";
        buttonPNG.style["font-size"] = "12px";
        buttonPNG.style["line-height"] = "1.4em";
        buttonPNG.style.margin = "5px 0 0 0";
        buttonPNG.textContent = "Download PNG";

        button.onclick = function (el) {
            download(d);
        };

        buttonPNG.onclick = function (el) {
            downloadPNG(d);
        };
    });
}

function initialize() {
    var documents = [window.document],
        SVGSources = [],
        iframes = document.querySelectorAll("iframe"),
        objects = document.querySelectorAll("object");

    // add empty svg element
    var emptySvgElement = window.document.createElementNS(prefix.svg, "svg");
    window.document.body.appendChild(emptySvgElement);
    var emptySvgDeclarationComputed = getComputedStyle(emptySvgElement);

    [].forEach.call(iframes, function (el) {
        try {
            if (el.contentDocument) {
                documents.push(el.contentDocument);
            }
        } catch (err) {
            console.error(err);
        }
    });

    [].forEach.call(objects, function (el) {
        try {
            if (el.contentDocument) {
                documents.push(el.contentDocument);
            }
        } catch (err) {
            console.error(err);
        }
    });

    documents.forEach(function (doc) {
        var newSources = _getSources(doc, emptySvgDeclarationComputed);
        // because of prototype on NYT pages
        for (var i = 0; i < newSources.length; i += 1) {
            SVGSources.push(newSources[i]);
        }
    });
    if (SVGSources.length > 1) {
        createPopover(SVGSources);
    } else if (SVGSources.length > 0) {
        download(SVGSources[0]);
    } else {
        alert("The Crowbar couldn’t find any SVG nodes.");
    }
}

exports.initialize = initialize;
exports.download = download;
exports.downloadPNG = downloadPNG;
exports.createPopover = createPopover;