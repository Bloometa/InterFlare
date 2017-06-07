const BrowserWindow = require('electron').remote.BrowserWindow
const ipcRenderer = require('electron').ipcRenderer
const path = require('path')

//const DataStore = require("../../modules/data/DataStore.js");
//const dataSrc = new DataStore();

//dataSrc.OpenDB();

const windowID = BrowserWindow.getFocusedWindow().id;

const addAccountForm = document.getElementById("data--add-account--form");
addAccountForm.addEventListener("submit", function(event) {
    event.preventDefault();
    
    var form = document.getElementById("data--add-account--form");
    var addAccountQuery = `
        INSERT INTO [Account] (
            [Name], [Password], [Network]
        ) VALUES (
            ?, ?, 'instagram'
        );
    `;

    var addAccountQueryParams = [
        form["data--add-account--username"].value,
        form["data--add-account--password"].value
    ];

    /*dataSrc.Run(addAccountQuery, addAccountQueryParams);
    console.log(dataSrc.Prepare(
        `SELECT * FROM [Account]
        WHERE [Network] = :network;`,
        {":network": "instagram"}
    ));*/

    /*ipc.send("datastore--query--run", {
        queryStr: addAccountQuery,
        queryParams: addAccountQueryParams
    });

    ipc.on("datastore--query--return-run", function(event, data) {
        ipc.send("datastore--query--prepared", {
            queryStr: `
                SELECT * FROM [Account]
                WHERE [Network] = :network;
            `,
            queryParams: {
                ":network": "instagram"
            }
        });

        ipc.on("datastore--query--prepared-return", function(event, data) {
            RenderAccounts(data);
        });
    });*/

    const computePath = "file://" + path.join(__dirname, "../compute/IQueryDataStore.html");
    let computeWindow = new BrowserWindow({ width: 400, height: 400, show: false });
    computeWindow.loadURL(computePath);

    computeWindow.webContents.on("did-finish-load", function() {
        computeWindow.webContents.send("datastore--query--run", {
            queryStr: addAccountQuery,
            queryParams: addAccountQueryParams
        }, windowID);
    });

    form.reset();
    return;
});

ipcRenderer.on("datastore--query--return-run", function(event) {
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

    console.log(data);

    for (var item in data) {
        AccountList += `
            <tr>
                <td>`+ data[item]["ID"] +`</td>
                <td>`+ data[item]["Name"] +`</td>
            </tr>
        `;
    }

    document.getElementById("data--add-account--account-list").innerHTML = AccountList;
    return;
}

QueryAccounts();