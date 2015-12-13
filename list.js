if (process.argv.length <= 2) {
    console.log("Usage:\n> node " + __filename + " path_to_directory");
    process.exit(-1);
}

var dirPath = process.argv[2];
var fs = require('fs'),
    path = require('path');

/* Recursively walk through the folder and it's subfolders under dir */
/* @param dir, the root path to walk through                         */
/* @param callback, callback function for the end of this func       */
/*                  callback(err, resultList)                        */
function list(dir, callback) {
    var container = [],
        counter = 0; // how many explorer are running?

    function explorer(dir, trail, callback) {
            // Store the folder name to position 0
        var _container = [dir.substring(dir.lastIndexOf(path.sep) + 1)];
        counter++;

        /* For this folder */
        fs.readdir(dir, function(err, items) {
            if (err && callback && typeof callback === "function")
                callback(err);

            var itemsLegnth = items.length;
            if (itemsLegnth === 0) counter--;

            /* For each item */
            items.forEach(function(item, index) {
                fs.stat(path.join(dir, item), function(err, stat) {
                    if (err && callback && typeof callback === "function")
                        callback(err);

                    if (stat.isDirectory()) {
                        _container.splice(1, 0, [item]); // insert the dir
                        explorer(path.join(dir, item), trail.concat(item), callback);
                    } else
                        _container.push(item);

                        // end of each item (async pattern)
                    if (--itemsLegnth === 0) {
                        if (trail.length === 0)
                            container = container.concat(_container);
                        else {
                            /* find the position of the container from the trail we recorded */
                            var containerTemp = container;
                            for (var i = 0; i < trail.length; i++) {
                                for (var j = 1; typeof containerTemp[j] == "object"; j++) {
                                    if (containerTemp[j][0] == trail[i]) {
                                        containerTemp = containerTemp[j];
                                    }
                                }
                                
                            }
                                // push the temp result to container
                            _container.shift();
                            Array.prototype.push.apply(containerTemp, _container);
                        }

                        /* end of the list function, call callback function */
                        if (--counter === 0 && callback && typeof callback === "function")
                            return callback(null, container);
                    }
                }); // end of fs.stat
            }); // end of items.forEach
        }); // end of fs.readdir
    }

    explorer(dir, [], callback);
}

function printList(files) {
    var stdout = process.stdout;

    function printExplorer(dir, layer, isLastOne) {
        /* print the name of current folder */
            // for root
        if (layer === 0)
            stdout.write(dir[0] + '\n');
            // for other folder name
        for (var i = 0; i < layer; i++) {
            if (i != layer - 1)
                stdout.write("│   ");
            else if (isLastOne === false)
                stdout.write("├─ " + dir[0] + '\n');
            else
                stdout.write("└─ " + dir[0] + '\n');
        }

        /* print items of the folder */
        for (i = 1; i < dir.length; i++) {
                // if the item is a folder
            if (typeof dir[i] == "object")
                printExplorer(dir[i], layer + 1, (i == dir.length - 1));
            else if (layer === 0) { // for the root folder
                if (i < dir.length - 1)
                    stdout.write("├─ " + dir[i] + '\n');
                else
                    stdout.write("└─ " + dir[i] + '\n');
            } else { // for the subfolders
                for (var j = 0; j < layer; j++) {
                    if (j != layer - 1 && layer !== 0)
                        stdout.write("│   ");
                    else if (i < dir.length - 1 && isLastOne)
                        stdout.write("    ├─ " + dir[i] + '\n');
                    else if (i < dir.length - 1)
                        stdout.write("│   ├─ " + dir[i] + '\n');
                    else if (isLastOne)
                        stdout.write("    └─ " + dir[i] + '\n');
                    else
                        stdout.write("│   └─ " + dir[i] + '\n');
                }
            }
        }
    }

    printExplorer(files, 0, (files.length <= 1) ? true : false);
}

list(dirPath, function(err, fileList) {
    if (err) {
        console.log("ERROR: " + err);
        throw err;
    }

    printList(fileList);
});

