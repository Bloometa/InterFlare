const BrowserWindow = require('electron').remote.BrowserWindow
const ipcRenderer = require('electron').ipcRenderer
const path = require('path')

//const DataStore = require("../../modules/data/DataStore.js");
//const dataSrc = new DataStore();

//dataSrc.OpenDB();

const windowID = BrowserWindow.getFocusedWindow().id;

document.getElementById("data--accounts--form").addEventListener("submit", function (event) {
    event.preventDefault();
});

document.getElementById("data--accounts--form").addEventListener("delete-event", function(event) {
    event.preventDefault();

    var activeID = document.getElementById("data--accounts--list--active-id");
    DoDeleteAccount(parseInt(activeID.value));

    activeID.parentNode.removeChild(activeID);
    return;
});

document.getElementById("data--accounts--form").addEventListener("edit-event", function(event) {
    event.preventDefault();

    var activeID = document.getElementById("data--accounts--list--active-id");
    SetupEditAccount(parseInt(activeID.value));

    activeID.parentNode.removeChild(activeID);
    return;
});

document.getElementById("data--accounts--form").addEventListener("cancel-edit-event", function(event) {
    event.preventDefault();

    var activeID = document.getElementById("data--accounts--list--active-id");
    activeID.parentNode.removeChild(activeID);

    QueryAccounts();
    return;
});

document.getElementById("data--accounts--form").addEventListener("save-edit-event", function(event) {
    event.preventDefault();

    var activeID = document.getElementById("data--accounts--list--active-id");
    DoEditAccount(parseInt(activeID.value));

    activeID.parentNode.removeChild(activeID);
    return;
});

const addAccountForm = document.getElementById("data--add-account--form");
addAccountForm.addEventListener("submit", function(event) {
    event.preventDefault();
    
    var form = document.getElementById("data--add-account--form");

    const computePath = "file://" + path.join(__dirname, "../compute/IQueryDataStore.html");
    let computeWindow = new BrowserWindow({ width: 400, height: 400, show: false });
    computeWindow.loadURL(computePath);

    computeWindow.webContents.on("did-finish-load", function() {
        computeWindow.webContents.send("datastore--query--run", {
            queryStr: `
                INSERT INTO [Account] (
                    [Name], [Password], [Network]
                ) VALUES (
                    ?, ?, 'instagram'
                );
            `,
            queryParams: [
                document.getElementById("data--add-account--username").value,
                document.getElementById("data--add-account--password").value
            ]
        }, windowID);
    });

    return;
});

ipcRenderer.on("datastore--query--return-run", function(event) {
    document.getElementById("data--add-account--form").reset();
    QueryAccounts();
});

function QueryAccounts() {
    const computePath = "file://" + path.join(__dirname, "../compute/IQueryDataStore.html");
    let computeWindow = new BrowserWindow({ width: 400, height: 400, show: false });
    computeWindow.loadURL(computePath);

    computeWindow.webContents.on("did-finish-load", function () {
        computeWindow.webContents.send("datastore--query--prepared", {
            queryStr: `
                SELECT * FROM [Account]
                WHERE [Network] = :network;
            `,
            queryParams: {
                ":network": "instagram"
            }
        }, windowID);
    });

    ipcRenderer.on("datastore--query--return-prepared", function (event, data) {
        RenderAccounts(data);
        return;
    });
}

function RenderAccounts(data) {
    var AccountList = "";

    for (var item in data) {
        var status = (data[item]["Verified"] >= 0) ? (data[item]["Verified"] === 0) ? "Waiting..." : "Logged in" : "Invalid";

        AccountList += `
            <tr id="data--add-account--list--`+ data[item]["ID"] +`">
                <td id="data--add-account--list--`+ data[item]["ID"] +`--id">`+ data[item]["ID"] +`</td>
                <td id="data--add-account--list--`+ data[item]["ID"] +`--name">`+ data[item]["Name"] +`</td>
                <td id="data--add-account--list--`+ data[item]["ID"] +`--pass">`+ data[item]["Password"] +`</td>
                <td id="data--add-account--list--`+ data[item]["ID"] +`--status">`+ status +`</td>
                <td id="data--add-account--list--`+ data[item]["ID"] +`--actions">
                    <button id="data--add-account--`+ data[item]["ID"] +`--edit" onclick="PushEvent('edit', `+ data[item]["ID"] +`);">Edit</button>
                    <button id="data--add-account--`+ data[item]["ID"] +`--delete" onclick="PushEvent('delete', `+ data[item]["ID"] +`);">Delete</button>
                </td>
            </tr>
        `;
    }

    document.getElementById("data--accounts--list").innerHTML = AccountList;
    return;
}

function SetupEditAccount(id) {
    if (!id) return false;
    if (typeof(id) !== "number") return false;

    document.getElementById("data--add-account--list--"+ id +"--name")
        .innerHTML = `<input type="text" value="`+ document.getElementById("data--add-account--list--"+ id +"--name").innerText +`">`;
    document.getElementById("data--add-account--list--"+ id +"--pass")
        .innerHTML = `<input type="text" value="`+ document.getElementById("data--add-account--list--"+ id +"--pass").innerText +`">`;

    document.getElementById("data--add-account--list--"+ id +"--actions")
        .innerHTML = `
            <button id="data--add-account--`+ id +`--cancel-edit" onclick="PushEvent('cancel-edit', `+ id +`);">Cancel</button>
            <button id="data--add-account--`+ id +`--save-edit" onclick="PushEvent('save-edit', `+ id +`);">Save</button>
        `;
}

function DoEditAccount(id) {
    if (!id) return false;
    if (typeof(id) !== "number") return false;

    const computePath = "file://" + path.join(__dirname, "../compute/IQueryDataStore.html");
    let computeWindow = new BrowserWindow({ width: 400, height: 400, show: false });
    computeWindow.loadURL(computePath);

    computeWindow.webContents.on("did-finish-load", function() {
        computeWindow.webContents.send("datastore--query--run", {
            queryStr: `
                UPDATE [Account] SET
                    [Name] = ?,
                    [Password] = ?
                WHERE
                    [ID] = ?;
            `,
            queryParams: [
                document.querySelector("#data--add-account--list--"+ id +"--name input").value,
                document.querySelector("#data--add-account--list--"+ id +"--pass input").value,
                id
            ]
        }, windowID);
    });
    return;
}

function DoDeleteAccount(id) {
    if (!id) return false;
    if (typeof(id) !== "number") return false;

    const computePath = "file://" + path.join(__dirname, "../compute/IQueryDataStore.html");
    let computeWindow = new BrowserWindow({ width: 400, height: 400, show: false });
    computeWindow.loadURL(computePath);

    computeWindow.webContents.on("did-finish-load", function () {
        computeWindow.webContents.send("datastore--query--run", {
            queryStr: `
                DELETE FROM [Account]
                WHERE ID = ?;
            `,
            queryParams: [ id ]
        }, windowID);
    });

    ipcRenderer.on("datastore--query--return-run", function (event) {
        QueryAccounts();
        return;
    });
}

QueryAccounts();