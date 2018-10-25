/**
 * Determines the fontFamily based on the specified fontWeight.
 *
 * @param {*} fontWeight The fontWeight from which the fontFamily should be determined.
 * @returns The string name of the fontFamily.
 */
export const getFontFamily = (fontWeight) => {
    const fontName = "NYTFranklin";

    if (fontWeight === 300 || fontWeight.toLowerCase() === "light") {
        return fontName + " Light";
    }
    if (fontWeight > 400 || fontWeight.toLowerCase() === "bold") {
        return fontName + " Bold";
    }
    return fontName + " Medium";
};

/**
 * Loops through all of the nodes on the specified root node and returns an array of the elements.
 *
 * @param {*} rootNode The root node from which to start the traversal.
 * @returns An array of the visited nodes.
 */
export const traverseNodes = (rootNode) => {
    const tree = [];

    tree.push(rootNode);

    const visit = (node) => {
        if (node && node.hasChildNodes()) {
            const child = node.firstChild;

            while (child) {
                if (child.nodeType === 1 && child.nodeName !== "SCRIPT") {
                    tree.push(child);
                    visit(child);
                }
                child = child.nextSibling;
            }
        }
    };

    visit(rootNode);
    return tree;
};

/**
 * Loads the contentDocument values from each of the elements in the specified nodesToSearch.
 *
 * @param {*} nodesToSearch The DOM nodes to be searched for contentDocument objects.
 * @returns An array of the found contentDocument objects.
 */
export const getContentDocuments = (nodesToSearch) => {
    return [].map.call(nodesToSearch, (el) => {
        try {
            if (el.contentDocument) {
                return el.contentDocument;
            }
        } catch (err) {
            console.error(err);
        }
        return null;
    });
};
