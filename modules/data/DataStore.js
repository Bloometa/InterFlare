var fs = require("fs");
var path = require("path");
var SQL = require("sql.js");

var method = DataStore.prototype;

function DataStore(storeFile = "./store.db") {
    this._dbFile = path.join(__dirname, storeFile);
}

method.OpenDB = function() {
    // Open the database synchrnously from the specified file that was set
    // when the class was constructed.

    try {
        try {
            var fStat = fs.statSync(this._dbFile);
            this._fileBuffer = new Buffer(fStat.size);
        } catch (e) {
            if (e.code == "ENOENT") {
                this._IInitialiseEngine(this._fileBuffer);
                return;
            } else {
                throw e;
            }
        }

        var fd = fs.openSync(this._dbFile, "r");
        var fBytes = fs.readSync(fd, this._fileBuffer, 0, this._fileBuffer.length, null);
        fs.closeSync(fd);

        this._IInitialiseEngine(this._fileBuffer);
        return;
    } catch (e) {
        throw new SQLException("EX_SQL_FILE_BUFFER_READ");
    }
};

method.OpenDBAsync = function() {
    // Open the database asynchronously from the specfied file that was set
    // when the class was constructed.
    // Like the other async classes, this should probably be a promise
    // function.

    try {
        fs.stat(this._dbFile, (e, stat) => {
            if (e) {
                if (e.code == "ENOENT") {
                    this._IInitialiseEngine(null);
                    return;
                }

                throw e;
            }

            fs.open(this._dbFile, "r", (e, fd) => {
                if (e) throw e;
                this._fileBuffer = new Buffer(stat.size);
                fs.read(fd, this._fileBuffer, 0, this._fileBuffer.length, null, (e, bytes, buffer) => {
                    if (e) throw e;
                    fs.close(fd, (fd) => {
                        this._IInitialiseEngine(this._fileBuffer);
                        return;
                    });
                });
            });
        });
    } catch (e) {
        throw new SQLException("EX_SQL_FILE_BUFFER_READ");
    }
};

method.UpdateDB = function() {
    // Save the buffer synchronously, would be used when the app is shutting
    // down. This is a blocking operation, so a particularly large DB would
    // be slow(ish) to sav, making the user wait for the window to close.
    // Perhaps an invisible window that closes itself when it's finished?

    try {
        var fd = fs.openSync(this._dbFile, "w");
        var fBytes = fs.writeSync(fd, this._db.export(), null, null);
        fs.closeSync(fd);
        console.log("Saved DB to file");
    } catch (e) {
        throw new SQLException("EX_SQL_FILE_BUFFER_WRITE");
    }
}

method.UpdateDBAsync = function() {
    // Save the database asynchronously, would be used after large changes
    // to the database that should be queued. Should make it a promise or
    // something later on.

    try {
        fs.open(this._dbFile, "w", (e, fd) => {
            if (e) throw e;
            fs.write(fd, this._db.export(), null, null, (e, bytes, str) => {
                if (e) throw e;
                fs.close(fd, (fd) => {
                    console.log("Saved DB to file");
                    return;
                });
            });
        });
    } catch (e) {
        throw new SQLException("EX_SQL_FILE_BUFFER_WRITE");
    }
}

method.CloseDB = function() {
    this.UpdateDB();
    this._db.close();
    return;
}

method.RefreshDB = function(dontSave) {
    // Just a shortcut function to save and reload the database from file.
    // Use false if you don't want to save. Synchronous function.

    if (dontSave) {
        this.OpenDB();
    } else {
        this.UpdateDB();
        this.OpenDB();
    }

    return;
}

method.RefreshDBAsync = function(dontSave) {
    // Just a shortcut function to save and reload the database from file.
    // Use false if you don't want to save. Asynchronous function.

    if (dontSave) {
        this.OpenDBAsync();
    } else { // This will probably cause problems
        this.UpdateDBAsync();
        this.OpenDBAsync();
    }

    return;
}

method.SwitchDB = function(storeFile, dontSave) {
    // Switch to a new DB file. Works the same as starting a new class.
    // Synchronous function. Can optionally ignore saving the current
    // database.

    this._dbFile = path.join(__dirname, storeFile);
    this.RefreshDB(dontSave);
    return;
}

method.SwitchDBAsync = function(storeFile, dontSave) {
    // Switch to a new DB file. Works the same as starting a new class.
    // Asynchronous function. Can optionally ignore saving the current
    // database.

    this._dbFile = path.join(__dirname, storeFile);
    this.RefreshDBAsync(dontSave);
    return;
}

method.Run = function(query, params) {
    return this._db.run(query, params);
}

method.Prepare = function(query, params) {
    var res = [];
    
    this._db.each(query, params, (row) => {
        res.push(row);
    });

    return res;
}

method.Exec = function(query) {
    return this._db.exec(query);
}

method._IInitialiseEngine = function(fileBuffer) {
    // Internal function that loads the database buffer into the SQL.js engine.
    // Will also setup the tables the app needs.

    if (fileBuffer != null) { console.log("Loaded DB from file");
        this._db = new SQL.Database(fileBuffer);
    } else { console.log("No DB on file, starting in-memory to be saved later");
        this._db = new SQL.Database();
    }

    try {
        this._db.run(`
            CREATE TABLE IF NOT EXISTS [Account] (
                [ID] INTEGER PRIMARY KEY AUTOINCREMENT,
                [Name] TEXT NOT NULL,
                [Password] TEXT,
                [Key] TEXT,
                [Network] TEXT,
                [Verified] INTEGER DEFAULT (0),
                [Added] TEXT DEFAULT (datetime('now', 'localtime')),
                [Updated] TEXT DEFAULT (datetime('now', 'localtime'))
            );
        `);
    } catch (e) {
        throw e;
    }

    return;
}

function SQLException(eid) {
    // Exception function, kinda messy.

    switch (eid) {
        case "EX_SQL_FILE_BUFFER_READ":
            this.eid = eid;
            this.message = "The SQL database file could not be read into the buffer.";
            this.suggestions = [];
            break;
        case "EX_SQL_FILE_BUFFER_EDIT":
            this.eid = eid;
            this.message = "The SQL database file could not be written to.";
            this.suggestions = [];
            break;
        case "EX_SQL_RUN":
            this.eid = eid;
            this.message = "The SQL run command failed.";
            this.suggestions = [];
            break;
        default:
            this.eid = eid;
            this.message = "An unknown exception occurred";
            this.suggestions = [];
            break;
    }
}

module.exports = DataStore;