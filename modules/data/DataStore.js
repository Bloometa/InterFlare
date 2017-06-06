var fs = require("fs");
var path = require("path");
var SQL = require("sql.js");

var method = DataStore.prototype;

function DataStore(storeFile = "./store.db") {
    var _db;
    this._dbFile = path.join(__dirname, storeFile);
}

method.Open = function() {
    try {
        fs.stat(this._dbFile, (e, stat) => {
            if (e) {
                if (e.code == "ENOENT") {
                    this._fileBuffer = null;
                    this._IInitialiseEngine();
                    return;
                }

                throw e;
            }

            fs.open(this._dbFile, "r", (e, fd) => {
                if (e) throw e;
                var _midBuff = new Buffer(stat.size);
                fs.read(fd, _midBuff, 0, _midBuff.length, null, (e, bytes, buffer) => {
                    if (e) throw e;
                    this._fileBuffer = buffer;
                    fs.close(fd, (fd) => {
                        this._IInitialiseEngine();
                        return;
                    });
                });
            });
        });
    } catch (e) {
        throw new SQLException("EX_SQL_FILE_BUFFER_READ");
    }
};

method.Close = function() {
    try {
        var _exportBinary = this._db.export();
        fs.open(this._dbFile, "w", (e, fd) => {
            if (e) throw e;
            fs.write(fd, _exportBinary, null, null, (e, bytes, str) => {
                if (e) throw e;
                fs.close(fd, (fd) => {
                    console.log("Saved DB to file.");
                    return;
                });
            });
        });
    } catch (e) {
        throw new SQLException("EX_SQL_FILE_BUFFER_WRITE");
    }
}

method._IInitialiseEngine = function() {
    if (this._fileBuffer !== null) { console.log("Loaded DB from file");
        this._db = new SQL.Database(this._fileBuffer);
    } else { console.log("No DB on file, starting an in-memory one");
        this._db = new SQL.Database();
    }

    try {
        this._db.run(`
            CREATE TABLE IF NOT EXISTS [Account] (
                [ID] INTEGER PRIMARY KEY,
                [Name] TEXT NOT NULL,
                [Password] TEXT,
                [Key] TEXT,
                [Network] TEXT,
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