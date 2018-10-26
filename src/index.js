import d3 from "d3";

import { prefix, doctype } from "./constants";
import { getFontFamily, traverseNodes, getContentDocuments } from "./helpers";

window.URL = (window.URL || window.webkitURL);

const { body } = document;

const _cleanup = () => {
    const crowbarElements = document.querySelectorAll(".svg-crowbar");

    [].forEach.call(crowbarElements, el => el.parentNode.removeChild(el));
};

const _setInlineStyles = (svg, emptySvgDeclarationComputed) => {
    const _explicitlySetStyle = (element) => {
        const CSSStyleDeclarationComputed = getComputedStyle(element);
        const { length } = CSSStyleDeclarationComputed;
        let key;
        let value;
        const computedStyleStr = "";

        for (let i = 0; i < length; i += 1) {
            key = CSSStyleDeclarationComputed[i];
            value = CSSStyleDeclarationComputed.getPropertyValue(key);
            if (value !== emptySvgDeclarationComputed.getPropertyValue(key) && key !== "font-family") {
                computedStyleStr += key + ":" + value + ";";
            }
        }
        if (element.tagName === "text" || element.tagName === "tspan") {
            computedStyleStr += "font-size:" + CSSStyleDeclarationComputed.fontSize + ";";
            const fontWeight = CSSStyleDeclarationComputed.fontWeight;
            const fontFamily = getFontFamily(fontWeight);

            computedStyleStr += "font-family:" + fontFamily + ";";
        }
        element.setAttribute("style", computedStyleStr);
    };

    // hardcode computed css styles inside svg
    traverseNodes(svg).forEach(e => _explicitlySetStyle(e));
};

const _getSources = (doc, emptySvgDeclarationComputed) => {
    const svgInfo = [],
        svgs = doc.querySelectorAll("svg");

    [].forEach.call(svgs, (svg) => {
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

        const source = (new XMLSerializer()).serializeToString(svg);
        const rect = svg.getBoundingClientRect();

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
};

export const download = (sourceSvg, filename = "untitled") => {
    console.log("Using Download SVG");

    if (filename === "untitled") {
        if (sourceSvg.id) {
            filename = sourceSvg.id;
        } else if (sourceSvg.class) {
            filename = sourceSvg.class;
        } else if (window.document.title) {
            filename = window.document.title.replace(/[^a-z0-9]/gi, "-").toLowerCase();
        }
    }

    const url = window.URL.createObjectURL(new Blob(sourceSvg.source, { type: "text/xml" }));

    const a = document.createElement("a");

    body.appendChild(a);
    a.setAttribute("class", "svg-crowbar");
    a.setAttribute("download", filename + ".svg");
    a.setAttribute("href", url);
    a.style.display = "none";
    a.click();

    setTimeout(() => window.URL.revokeObjectURL(url), 10);
};

export const downloadPNG = (sourceSvg, filename = "untitled") => {
    console.log("Using Download PNG");

    if (filename === "untitled") {
        if (sourceSvg.id) {
            filename = sourceSvg.id;
        } else if (sourceSvg.class) {
            filename = sourceSvg.class;
        } else if (window.document.title) {
            filename = window.document.title.replace(/[^a-z0-9]/gi, "-").toLowerCase();
        }
    }

    const canvas = document.createElement("canvas");
    let width = typeof sourceSvg.width === "number" ? sourceSvg.width : null;
    let height = typeof sourceSvg.height === "number" ? sourceSvg.height : null;

    if (!width || !height) {
        const bBox = sourceSvg.getBBox();

        width = bBox.width;
        height = bBox.height;
    }

    body.appendChild(canvas);
    canvas.setAttribute("id", "svg-image");
    canvas.setAttribute("width", width);
    canvas.setAttribute("height", height);
    canvas.style.display = "none";

    const canvasSvgImage = document.querySelector("canvas#svg-image");
    const context = canvasSvgImage.getContext("2d");
    const imgsrc = "data:image/svg+xml;base64," + btoa(sourceSvg.source || sourceSvg.outerHTML);
    const image = document.createElement("img");

    // This isn't getting called.
    image.onload = () => {
        context.drawImage(image, 0, 0);
        const canvasdata = canvas.toDataURL("image/png");

        const pngimg = '<img src="' + canvasdata + '" width="' + sourceSvg.width + '" height="' + sourceSvg.height + '">';

        d3.select("#pngdataurl").html(pngimg);

        const a = document.createElement("a");

        a.download = filename + ".png";
        a.href = canvasdata;
        document.body.appendChild(a);
        a.click();
    };
    image.src = imgsrc;
};

export const createPopover = (sources) => {
    _cleanup();

    sources.forEach((sourceA) => {
        sources.forEach((sourceB) => {
            if (sourceA !== sourceB) {
                if ((Math.abs(sourceA.top - sourceB.top) < 38) && (Math.abs(sourceA.left - sourceB.left) < 38)) {
                    sourceB.top += 38;
                    sourceB.left += 38;
                }
            }
        });
    });

    const buttonsContainer = document.createElement("div");

    body.appendChild(buttonsContainer);

    buttonsContainer.setAttribute("class", "svg-crowbar");
    buttonsContainer.style["z-index"] = 1e7;
    buttonsContainer.style.position = "absolute";
    buttonsContainer.style.top = 0;
    buttonsContainer.style.left = 0;

    const background = document.createElement("div");

    body.appendChild(background);

    background.setAttribute("class", "svg-crowbar");
    background.style.background = "rgba(255, 255, 255, 0.7)";
    background.style.position = "fixed";
    background.style.left = 0;
    background.style.top = 0;
    background.style.width = "100%";
    background.style.height = "100%";

    sources.forEach((d, i) => {
        const buttonWrapper = document.createElement("div");

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

        const button = document.createElement("button");

        buttonWrapper.appendChild(button);
        button.setAttribute("data-source-id", i);
        button.style.width = "150px";
        button.style["font-size"] = "12px";
        button.style["line-height"] = "1.4em";
        button.style.margin = "5px 0 0 0";
        button.textContent = "Download SVG";

        const buttonPNG = document.createElement("button");

        buttonWrapper.appendChild(buttonPNG);
        buttonPNG.setAttribute("data-source-id", i);
        buttonPNG.style.width = "150px";
        buttonPNG.style["font-size"] = "12px";
        buttonPNG.style["line-height"] = "1.4em";
        buttonPNG.style.margin = "5px 0 0 0";
        buttonPNG.textContent = "Download PNG";

        button.onclick = (el) => {
            download(d);
        };

        buttonPNG.onclick = (el) => {
            downloadPNG(d);
        };
    });
};

export const initialize = () => {
    const documents = [window.document];
    const SVGSources = [];
    const iframes = document.querySelectorAll("iframe");
    const objects = document.querySelectorAll("object");
    // add empty svg element
    const emptySvgElement = window.document.createElementNS(prefix.svg, "svg");

    window.document.body.appendChild(emptySvgElement);
    const emptySvgDeclarationComputed = getComputedStyle(emptySvgElement);

    documents = [ ...documents, ...getContentDocuments(iframes), ...getContentDocuments(objects) ];

    documents.forEach((doc) => {
        const newSources = _getSources(doc, emptySvgDeclarationComputed);
        // because of prototype on NYT pages

        for (const i = 0; i < newSources.length; i += 1) {
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
};
