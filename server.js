/**
 * Server main file.
 *
 * Here lies the whole server core.
 *
 * @link   https://github.com/DianaLeNeant/ArtemisaNode
 * @author Diana Celeste Nuño Ramírez. 2018.
 */

// includes
var lpath = __dirname + "/";
var files = require('fs');
var reload = require('require-reload')(require);
var privateKey  = files.readFileSync('ssl/privkey.pem', 'utf8');
var certificate = files.readFileSync('ssl/cert.pem', 'utf8');

var credentials = {key: privateKey, cert: certificate};

var server = require('express')();
var http = require('http').createServer(server);
var https = require('https').createServer(credentials, server);

var io = require('socket.io')(https, { pingTimeout: 60000 });
var bodyParser = require('body-parser');
var pdf = require('html-pdf');
var multer = require('multer');
var upload = multer({
    storage: multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, 'uploads');
        },
        filename: function (req, file, cb) {
            cb(null, file.fieldname + '-' + nameGen() + '-' + file.originalname);
        }
    })
});

var crypto = require('crypto');
var mime = require('mime-types');
var colors = require('colors');
var getJSON = require('get-json');
var artemisa = require('artemisa'); // stored sessions
var readLastLines = require('read-last-lines');
var nodemailer = require('nodemailer');

var responser = require('postResponse');
var qrcode = require('qrcode-generator');
var eExists = require('email-exists');
var shell = require('shelljs');

var moment = require('moment');
const Nexmo = require('nexmo');
const nexmo = new Nexmo(consultConfiguration('sms', 'default'));
var exeoffset = Number(files.readFileSync('exeoffset', 'utf8'));

var port = consultConfiguration('server', 'port');
var reminderInterval = null;

var readline = null;
var rl = null;
var conA = false;
var uReset = false;

console.log("Use '--console' parameter to activate command input console.");
console.log("Use '--port {port number}' parameter to listen to a different port.");
process.argv.forEach(function (val, index, array) {
    if (val == '--console') {
        conA = true;
        console.log('command input activated'.cyan);
    }
    if (val == '--port') {
        port = Number(array[index + 1]);
        console.log(`listening port changed to ${port}`.cyan);
    }
});
if (conA) {
    readline = require('readline');
    rl = readline.createInterface(process.stdin, process.stdout);
}

// definitions
var html_h = files.readFileSync('default/header.html', 'utf8'); // global header
var html_f = files.readFileSync('default/footer.html', 'utf8'); // global footer

var actual_security_key = 'artemisa_pass';
var last_security_key = 'artemisa_pass';

var resultStatus = {
    query_failed: 0,
    row_found: 1,
    inserted: 3,
    modified: 4,
}

function cryp(str) {
    if (str.constructor !== String) {
        str = String(str);
    }

    var cry = crypto.createCipher('aes-128-cbc', actual_security_key); // encrypter
    var crys = cry.update(str, 'utf8', 'hex');
    crys += cry.final('hex');
    return crys;
}
function dcryp(str, securityKey = actual_security_key) {
    var dcry = crypto.createDecipher('aes-128-cbc', securityKey); // decrypter
    var crys = dcry.update(str, 'hex', 'utf8');
    crys += dcry.final('utf8');
    return crys;
}
function dateSQL(date) {
    dte = String(date);
    var m = null;
    if (dte == 'now') {
        m = moment();
    } else {
        m = moment(dte);
    }

    if (m.isValid()) {
        return m.format('YYYY-MM-DD').toString();
    } else {
        return NaN;
    }

    /*
    var ret = (String(date.getFullYear()) + '-' + String(("0" + String(date.getMonth() + 1)).slice(-2)) + '-' + String(("0" + String(date.getDate())).slice(-2)));
    if (ret.toLowerCase().includes('nan') || ret.toLowerCase().includes('0000')) ret = NaN;
    return ret;
    */
}
function datetimeSQL(date) {
    dte = String(date);
    var m = null;
    if (dte == 'now') {
        m = moment();
    } else {
        m = moment(dte);
    }

    if (m.isValid()) {
        return m.format('YYYY-MM-DD HH:mm:ss').toString();
    } else {
        return NaN;
    }

    /*
    var ret = (String(date.getFullYear()) + '-' + String(("0" + String(date.getMonth() + 1)).slice(-2)) + '-' + String(("0" + String(date.getDate())).slice(-2)) + ' ' + String(("0" + String(date.getHours())).slice(-2)) + ':' + String(("0" + String(date.getMinutes())).slice(-2)) + ':' + String(("0" + String(date.getSeconds())).slice(-2)));
    if (ret.toLowerCase().includes('nan') || ret.toLowerCase().includes('0000')) ret = NaN;
    return ret;
    */
}
function nameGen(random_limit = false) {
    var start = 0;
    var limit = (random_limit ? Math.floor(Math.random() * 10) : 20);
    var ret = '';
    while (start < limit + 1) {
        ret += Math.floor(Math.random() * 10); start++;
    }
    return ret;
}
function fGen(random_limit = false) {
    var start = 0;
    var limit = (random_limit ? Math.floor(Math.random() * 10) : 9);
    var ret = '';
    var letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j']
    while (start < limit + 1) {
        if (Math.floor(Math.random() * 2) == 0) {
            ret += letters[Math.floor(Math.random() * 10)]; start++;
        } else {
            ret += Math.floor(Math.random() * 10); start++;
        }
    }
    return String(ret).toUpperCase();
}
function xfGen(name, ID) {
    var spl = String(name).split(' ');
    var initials = (spl.length > 0 ? spl[0][0] : 'X') + (spl.length > 1 ? spl[1][0] : 'X');

    var ret = initials + '-' + String(("00000" + String(ID)).slice(-5));

    return String(ret).toUpperCase();
}
function qrGen(data, title = 'qr') {
    qrcode.stringToBytes = qrcode.stringToBytesFuncs['UTF-8'];

    var qr = qrcode(0, 'H');
    qr.addData(data, 'Byte');
    qr.make();
    var URL = 'uploads/' + title + fGen() + '.gif';

    var b64 = qr.createDataURL(4).replace(/^data:image\/gif;base64,/, "");
    files.writeFileSync(lpath + URL, b64, 'base64', function (err) {
        if (err) {
            artemisa.cLog(`     ->>!!! Error generating QR: ${err}`);
        }
    });

    return [qr.createImgTag(), URL];
}
function qrB64(data) {
    qrcode.stringToBytes = qrcode.stringToBytesFuncs['UTF-8'];

    var qr = qrcode(0, 'H');
    qr.addData(data, 'Byte');
    qr.make();

    var b64 = qr.createDataURL(4).replace(/^data:image\/gif;base64,/, "");

    return b64;
}
function qrImageTag(data) {
    qrcode.stringToBytes = qrcode.stringToBytesFuncs['UTF-8'];

    var qr = qrcode(0, 'H');
    qr.addData(data, 'Byte');
    qr.make();

    return qr.createImgTag();
}
function formatMoney(n, c, d, t) {
    var c = isNaN(c = Math.abs(c)) ? 2 : c,
        d = d == undefined ? "." : d,
        t = t == undefined ? "," : t,
        s = n < 0 ? "-" : "$",
        i = String(parseInt(n = Math.abs(Number(n) || 0).toFixed(c))),
        j = (j = i.length) > 3 ? j % 3 : 0;

    return s + (j ? i.substr(0, j) + t : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : "");
}
function secureParse(str) {
    if (!str) return undefined;
    if (str.constructor === Object) return str;
    if (str.constructor !== String) return undefined;

    if (files.existsSync(lpath + 'config/' + str)) {
        var s = files.readFileSync(lpath + 'config/' + str, 'utf8').replace('\t', '');
        var ret;
        while (s.includes('\t')) {
            s = s.replace('\t', '')
        }
        try {
            ret = JSON.parse(s.replace('\t', ''));
        } catch (error) {
            ret = undefined;
        }
        return ret;
    } else {
        var s = str.replace('\t', '');
        var ret;
        while (s.includes('\t')) {
            s = s.replace('\t', '')
        }
        try {
            ret = JSON.parse(s.replace('\t', ''));
        } catch (error) {
            ret = undefined;
        }
        return ret;
    }
}
function reminders() {
    var dayStartsAt = Number(consultConfiguration('server', 'dayStart'));
    if (moment().weekday() < 5) {
        if (moment().hour() == dayStartsAt && !uReset) {
            query('SELECT ID, Acceso FROM usuarios;', function(loginRes) {
                if (loginRes) { if (loginRes.length > 0) {
                    for (let x = 0; x < loginRes.length; x++) {
                        if (!artemisa.consultAreas(loginRes[x].Acceso).isAbsent) {
                            query(`UPDATE usuarios SET Acceso = '${String(loginRes[x].Acceso)};absent' WHERE ID = '${loginRes[x].ID}';`)
                        }
                    }
                }}
            });
            uReset = true;
        } else {
            if (moment().hour() > dayStartsAt || moment().hour() < dayStartsAt) uReset = false;
            artemisa.cLog('-----> !!! Day started at ' + Number(consultConfiguration('server', 'dayStart')) + ' or users have been yet reset. Users will stay at the same absent status before.');
            return;
        }
    }

    var from = moment().seconds(0).format('YYYY-MM-DD HH:mm:ss').toString();
    var to = moment().add(15, 'minutes').format('YYYY-MM-DD HH:mm:ss').toString();
    query(`SELECT ID, Fecha, Creador, Mensaje, RAW, AtendidoPor FROM notificaciones WHERE Fecha BETWEEN '${from}' AND '${to}';`, function (result) {
        if (result) { if (result.length > 0) {
            artemisa.cLog(`!! ------->  there are ${result.length} reminders to do ...`);
                getCategoryList('usuarios', 'Usr', 'ID', function (users) {
                    for (let x = 0; x < result.length; x++) {
                        var r = secureParse(result[x].RAW);
                        if (r) { if (r.type == 'reminder') {
                            if (result[x].AtendidoPor == null) {
                                emitExactNotification(users[result[x].Creador], [users[result[x].Creador]], `Tienes un recordatorio: <p>${result[x].Mensaje}</p>`, {type: 'reminder', title: 'Recordatorio', id: result[x].ID, time: result[x].Fecha});
                            }
                        }}
                    }
                });
        } else {
            artemisa.cLog('!! ------->  there are no reminders to do ...');
        } }
    });
}

function mail(templateObject, to, subject, html, callBack = function(result) {}, includeHeaderFooter = true, from = null, transport_config) {
    var head = '';
    var foot = '';
    if (includeHeaderFooter) {
        head = files.readFileSync(lpath + 'mail/header.html');
        foot = files.readFileSync(lpath + 'mail/footer.html');
    }

    files.readFile(lpath + '/mail/template/' + html, function(errf, data) {
        if (!errf) {
            html = data;
        }
        var templated = htmlTemplate(head, html, foot, templateObject);
        if (from == null) from = consultConfiguration('mail', 'defaultFromString');
        let options = {
            from: from,
            to: to,
            bcc: consultConfiguration('mail', 'defaultMailBcc'),
            subject: subject,
            html: templated
        }

        var transport = nodemailer.createTransport( consultConfiguration('mail', transport_config) );
        transport.sendMail(options, function (err, inf) {
            if (err) {
                artemisa.cLog(`     ---> !!! Error sending mail. ${error}`);
                callBack(false);
            } else {
                artemisa.cLog(`     ---> [ Message Sent to '${to}', as '${inf.messageId}' ]`)
                callBack(true);
            }
        });
    });
}
function sendSMS(to, message) {
    artemisa.cLog(' --->!! Sending message to: ' + to);
    const t = to;
    const m = message;
    try {
        nexmo.message.sendSms(consultConfiguration('sms', 'SMSNexmoNumber'), t, m);
    } catch (error) {
        artemisa.cLog('     ---->> !!! Error sending SMS: ' + String(error));
    }
}

// Server and Command Console Functions
http.listen(port + 1, function() {
    artemisa.cLog(`[ Insecure Server started at port ${port + 1}]`);
});
https.listen(port, function() {
    artemisa.cLog(`[ Secure Server started at port ${port}]`);
});

server.use(bodyParser.json()); // support json encoded bodies
server.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
server.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});


reminderInterval = setInterval(reminders, 300000); // testing purpose!! --> 300000 is the production interval value

if (conA) {
    rl.setPrompt('Artemisa Server> ');
    artemisa.cLog = (function() {
        var cached_function = artemisa.cLog;

        return function() {
            var result = cached_function.apply(this, arguments); // use .apply() to call it
            rl.prompt();
            return result;
        };
    })();

    rl.on('line', function(line) {
        if (line === 'end.') rl.close();
        if (line === 'help.') {
            artemisa.cLog(
                '---: Artemisa Server Command List :---\n\n' +
                '   sessions\\show{}.                   -> Shows the active sessions.\n' +
                '   sessions\\delete{client_ip}.        -> Deletes the client_ip session.\n' +
                '   cry{str}.                           -> Encrypts the str.\n' +
                '   dcry{str}.                          -> Decrypts the str.\n' +
                '   user\\create{fullname, username, password, access, email, area}.\n' +
                '       -> Creates a new user with specified params.\n' +
                '   user\\delete{ID}.                   -> Deletes the user with ID.\n' +
                '   user\\list{}.                       -> List the actual users.\n' +
                '   cat{table, category, id}.\n' +
                '       -> List the table rows selecting ID and Category columns.'
            );
            return;
        }
        // command.subcommand{param; params...}.
        var cmd = null;
        var params = null;
        if (!line.includes('{') || !line.includes('}') || line.substr(line.length - 1) != '.') {
            artemisa.cLog('--// Artemisa Console Syntax Error');
        } else {
            cmd = line.split('{')[0].split('\\');
            params = line.split('{')[1].split('}')[0].split(';');
            for (let i = 0; i < params.length; i++) {
                params[i] = params[i].trim();
            }

            switch (cmd[0]) {
                case 'sessions':
                    switch (cmd[1]) {
                        case 'show':
                            artemisa.cLog('< ' + JSON.stringify(artemisa.sessions) + ' >');
                            break;

                        case 'delete':
                            if (sessionExists(params[0])) {
                                artemisa.sessions[params[0]] = undefined;
                            } else {
                                artemisa.cLog('< Session Not Found >');
                            }
                            break;
                    }
                    break;
                case 'cry':
                    artemisa.cLog(cryp(params[0]));
                break;
                case 'dcry':
                    artemisa.cLog(dcryp(params[0]));
                break;
                case 'user':
                    switch (cmd[1]) {
                        case 'create':
                            query(`INSERT INTO usuarios (Nombre, Usr, Pss, Acceso, Correo, Area) VALUES ('${params[0]}', '${params[1]}', '${cryp(params[2])}', '${params[3]}', '${params[4]}', '${params[5]}');`, function(res) {
                                if (res) {
                                    artemisa.cLog('< User Created >');
                                } else {
                                    artemisa.cLog(`< Database Query Failed >`);
                                }
                            });
                        break;

                        case 'delete':
                            query(`DELETE FROM usuarios WHERE ID = ${params[0]};`, function(res) {
                                if (res) {
                                    artemisa.cLog('< User Deleted >');
                                } else {
                                    artemisa.cLog(`< Database Query Failed >`);
                                }
                            });
                        break;
                        case 'list':
                            query('SELECT ID, Usr, Acceso FROM usuarios;', function(res) {
                                if (res) {
                                    artemisa.cLog(`< ${JSON.stringify(res)} >`);
                                } else {
                                    artemisa.cLog(`< Database Query Failed >`);
                                }
                            });
                        break;
                    }
                break;
                case 'cat':
                    getCategory(params[0], params[1], params[2], function(res) {
                        if (res) {
                            artemisa.cLog(`< ${JSON.stringify(res)} >`);
                        } else {
                            artemisa.cLog(`< Database Query Failed >`);
                        }
                    });
                break;

                case 'securityChange':
                    query('SELECT ID, Usr, Pss FROM usuarios;', function(res) {
                        if (res) {
                            for (let rx = 0; rx < res.length; rx++) {
                                var lpass = dcryp(res[rx].Pss, last_security_key);
                                var npass = cryp(lpass);
                                artemisa.cLog(`< ${res[rx].Usr} with password '${lpass}'/'${res[rx].Pss}' will change to '${npass}' >`);
                            }
                        } else {
                            artemisa.cLog(`< Database Query Failed >`);
                        }
                    });
                break;
                case 'applySecurityChange':
                    query('SELECT ID, Usr, Pss FROM usuarios;', function(res) {
                        if (res) {
                            for (let rx = 0; rx < res.length; rx++) {
                                var lpass = dcryp(res[rx].Pss, last_security_key);
                                var npass = cryp(lpass);
                                query(`UPDATE usuarios SET Pss='${npass}' WHERE ID='${res[rx].ID}';`, function(what) {
                                    if (what) {
                                        artemisa.cLog(`< ${res[rx].Usr} with password '${lpass}'/'${res[rx].Pss}' changed to '${npass}' >`);
                                    } else {
                                        artemisa.cLog(`< Database Query Failed >`);
                                    }
                                })
                            }
                        } else {
                            artemisa.cLog(`< Database Query Failed >`);
                        }
                    });
                break;
                case 'ms':
                    //sms('+525542170115', 'holo');
                break;
                default:
                    artemisa.cLog('< Unrecognized Command >');
                    break;
            }
        }
        rl.prompt();
    }).on('close',function(){
        process.exit(0);
    });
}

// Sockets handler for chat functions
function checkSession(session) {
    if (secureParse(session.user_info.Nombre) == undefined || secureParse(session.user_info.Nombre) == null) {
        artemisa.cLog('     ->! Invalid Session for Command');
        artemisa.cLog(`         -::! ${JSON.stringify(session)}`)
        return false;
    } else {
        if (secureParse(session.user_info.Nombre)[0] == '{ not logged in }') return false;
        return true;
    }
}
/**
 * Emits a notification to the specified areas.
 *
 * Emits a notification, from an active session, to the specified areas.
 *
 * @param {String} fromSession Session ID of the notification emmiter.
 * @param {Array} to Array of strings containing the areas whose have to be notified.
 * @param {String} message Human-readable notification message.
 * @param {Object} data Object containing all the data related to the notification.
 * @param {Boolean} insert Wether inserts the notification to the database or not (default true).
 */
function emitNotification(fromSession, to, message, data, insert = true) {
    if (artemisa.sessionExists(fromSession)) {
        var ndata = {
            from: artemisa.sessions[fromSession].user_info.ID,
            isForeign: artemisa.consultAreas(artemisa.sessions[fromSession].user_info.Acceso).flags.includes('foreign'),
            to: to,
            message: message,
            data: data
        }
        var today = datetimeSQL('now');
        if (!insert) {
            io.emit('notification', ndata)
            return true;
        }
        var addQ = function(a) {
            if (a < to.length) {
                var toa = [to[a]];
                if (artemisa.sessions[fromSession].area == to[a]) {
                    addQ(a+1);
                    return;
                }
                query(`SELECT * FROM notificaciones WHERE Destino = '${JSON.stringify(toa)}' AND Creador = '${artemisa.sessions[fromSession].user_info.ID}' AND Fecha = '${today}';`, function (resq) {
                    if (resq.length == 0) {
                        query(`INSERT INTO notificaciones (Destino, Creador, RAW, Mensaje, Fecha) VALUES ('${JSON.stringify(toa)}', '${artemisa.sessions[fromSession].user_info.ID}', '${JSON.stringify(data)}', '${message}', '${today}');`,
                        function(inres) {
                            if (inres) {
                                artemisa.cLog(`         -> | Notification emmited. ${JSON.stringify(ndata)} |`);
                                io.emit('notification', ndata)
                                addQ(a+1);
                            } else {
                                return false
                            }
                        })
                    } else {
                        query(`UPDATE notificaciones SET RAW = '${JSON.stringify(data)}', Mensaje = '${message}' WHERE Destino = '${JSON.stringify(toa)}' AND Creador = '${artemisa.sessions[fromSession].user_info.ID}' AND Fecha = '${today}';`,
                        function(inres) {
                            if (inres) {
                                artemisa.cLog(`         -> | Notification emmited. ${JSON.stringify(ndata)} |`);
                                io.emit('notification', ndata)
                                addQ(a+1);
                            } else {
                                return false;
                            }
                        })
                    }
                });
            }
        }

        addQ(0);
    } else {
        return false;
    }
}
/**
 * Emits a notification to the specified areas.
 *
 * Emits a notification, from the specified user name, to the specified areas.
 *
 * @param {String} fromUser User name of the notification emiter.
 * @param {Array} to Array of strings containing the areas whose have to be notified.
 * @param {String} message Human-readable notification message.
 * @param {Object} data Object containing all the data related to the notification.
 * @param {Boolean} insert Wether inserts the notification to the database or not (default true).
 */
function emitUserNotification(fromUser, to, message, data, insert = true) {
    query(`SELECT * FROM usuarios WHERE Usr='${fromUser}';`, function(resU) {
        if (resU){
            if (resU.length > 0) {
                var ndata = {
                    from: resU[0].ID,
                    to: to,
                    message: message,
                    data: data
                }
                var today = datetimeSQL('now');
                if (!insert) {
                    io.emit('notification', ndata)
                    return true;
                }
                query(`SELECT * FROM notificaciones WHERE Destino = '${JSON.stringify(to)}' AND Creador = '${resU[0].ID}' AND Fecha = '${datetimeSQL(today)}';`, function (resq) {
                    if (resq.length == 0) {
                        query(`INSERT INTO notificaciones (Destino, Creador, RAW, Mensaje, Fecha) VALUES ('${JSON.stringify(to)}', '${resU[0].ID}', '${JSON.stringify(data)}', '${message}', '${datetimeSQL(today)}');`,
                        function(inres) {
                            if (inres) {
                                artemisa.cLog(`         -> | Notification emmited. ${JSON.stringify(ndata)} |`);
                                io.emit('notification', ndata)
                            } else {
                                return false
                            }
                        })
                    } else {
                        query(`UPDATE notificaciones SET RAW = '${JSON.stringify(data)}', Mensaje = '${message}' WHERE Destino = '${JSON.stringify(to)}' AND Creador = '${resU[0].ID}' AND Fecha = '${datetimeSQL(today)}';`,
                        function(inres) {
                            if (inres) {
                                artemisa.cLog(`         -> | Notification emmited. ${JSON.stringify(ndata)} |`);
                                io.emit('notification', ndata)
                            } else {
                                return false;
                            }
                        })
                    }
                });
            }
        }
    });
}
/**
 * Emits a notification to the specified user.
 *
 * Emits a notification, from the specified user name, to the specified user(s).
 *
 * @param {String} fromUser User name of the notification emiter.
 * @param {Array} to Array of strings containing the users whose have to be notified.
 * @param {String} message Human-readable notification message.
 * @param {Object} data Object containing all the data related to the notification.
 * @param {Boolean} insert Wether inserts the notification to the database or not.
 */
function emitExactNotification(fromUser, to, message, data, insert = false) {
    query(`SELECT * FROM usuarios WHERE Usr='${fromUser}';`, function(resU) {
        if (resU){
            if (resU.length > 0) {
                var ndata = {
                    from: resU[0].ID,
                    to: to,
                    message: message,
                    data: data
                }
                var today = datetimeSQL('now');
                if (!insert) {
                    io.emit('notification', ndata)
                    return true;
                }
                query(`SELECT * FROM notificaciones WHERE Destino = '${JSON.stringify(to)}' AND Creador = '${resU[0].ID}' AND Fecha = '${datetimeSQL(today)}';`, function (resq) {
                    if (resq.length == 0) {
                        query(`INSERT INTO notificaciones (Destino, Creador, RAW, Mensaje, Fecha) VALUES ('${JSON.stringify(to)}', '${resU[0].ID}', '${JSON.stringify(data)}', '${message}', '${datetimeSQL(today)}');`,
                        function(inres) {
                            if (inres) {
                                artemisa.cLog(`         -> | Notification emmited. ${JSON.stringify(ndata)} |`);
                                io.emit('notification', ndata)
                            } else {
                                return false;
                            }
                        });
                    } else {
                        query(`UPDATE notificaciones SET RAW = '${JSON.stringify(data)}', Mensaje = '${message}' WHERE Destino = '${JSON.stringify(to)}' AND Creador = '${resU[0].ID}' AND Fecha = '${datetimeSQL(today)}';`,
                        function(inres) {
                            if (inres) {
                                artemisa.cLog(`         -> | Notification emmited. ${JSON.stringify(ndata)} |`);
                                io.emit('notification', ndata)
                            } else {
                                return false;
                            }
                        });
                    }
                });
            }
        }
    });
}
io.on('connection', function (socket) {
    artemisa.cLog(` -!- Connection from ${socket.handshake.address} -!-`)
    requestID(socket, function(answer) {
        var from = answer.id;
        if (from == undefined) {
            artemisa.cLog('!!! ---> Invalid session identifier. Aborting comunication.');
            emitCommand(socket, 'invalidsession');
            return;
        }
        var session = {
            user_info: {
                Nombre: {
                    '0': '{ not logged in }'
                }
            }
        }
        if (!artemisa.sessionExists(from)) {
            artemisa.cLog(`---[ User ${from} connected and creating session. ]---`);
            artemisa.setSession(from, null, { Nombre: '{ not logged in }' }, socket.id);
        } else {
            session = artemisa.sessions[from];
        }

        if (session.nav == undefined) {
            emitCommand(socket, 'start');
        }
        socket.on('command', function (data, fn) {
            var replied = false;
            if (fn.constructor !== Function) {
                fn = function(a) {};
            }
            artemisa.cLog(`   -:> [ command received from ${from} as ${session.user_info.Nombre}: '${ JSON.stringify(data) }' ]`);
            if (session.lastCmd != undefined) {
                artemisa.cLog(`   -:> [ Last command was: '${ JSON.stringify(session.lastCmd) }' ]`);
                if (JSON.stringify(session.lastCmd) == JSON.stringify(data)) {
                    replied = true;
                    if (session.lastCmdcount != undefined) {
                        session.lastCmdcount += 1;
                        if (session.lastCmdcount > 4) {
                            artemisa.cLog(`   -:> [ too many command replications... Aborting. ]`);
                            fn ({});
                            session.lastCmdcount = 0;
                            return;
                        }
                    } else {
                        session.lastCmdcount = 0;
                    }
                } else {
                    replied = false;
                    session.lastCmd = data;
                }
            } else {
                session.lastCmd = data;
            }
            switch (data.cmd) {
                case 'ping':
                    artemisa.cLog(`    -:> [ : '${JSON.stringify(data.cmd)}' ]`);
                    fn({
                        definition: 'pong',
                        response: null
                    });
                break;
                case 'getCat':
                    if (data.par.T != 'areas') {
                        if (!checkSession(session)) {
                            fn ({});
                            break;
                        }
                    }
                    if (data.par.W != undefined) {
                        if (!data.par.W.includes('=')) {
                            query(`SELECT ${data.par.I}, ${data.par.C} FROM ${data.par.T} WHERE ${data.par.W}='${session.user_info.ID}';`, function(res) {
                                fn({
                                    result: res
                                });
                            });
                        } else {
                            query(`SELECT ${data.par.I}, ${data.par.C} FROM ${data.par.T} WHERE ${data.par.W};`, function(res) {
                                fn({
                                    result: res
                                });
                            });
                        }
                    } else {
                        getCategory(data.par.T, data.par.C, data.par.I, function(res) {
                            fn({
                                result: res
                            });
                        });
                    }
                break;
                case 'getCatL':
                    if (data.par.T != 'areas') {
                        if (!checkSession(session)) {
                            fn ({});
                            break;
                        }
                    }
                    if (data.par.W != undefined) {
                        if (!data.par.W.includes('=')) {
                            queryList(`SELECT ${data.par.I}, ${data.par.C} FROM ${data.par.T} WHERE ${data.par.W}='${session.user_info.ID}';`, data.par.I, function(res) {
                                fn({
                                    result: res
                                });
                            });
                        } else {
                            queryList(`SELECT ${data.par.I}, ${data.par.C} FROM ${data.par.T} WHERE ${data.par.W};`, data.par.I, function(res) {
                                fn({
                                    result: res
                                });
                            });
                        }
                    } else {
                        getCategoryList(data.par.T, data.par.C, data.par.I, function(res) {
                            fn({
                                result: res
                            });
                        });
                    }
                break;
                case 'getCatR':
                    if (data.par.T != 'areas') {
                        if (!checkSession(session)) {
                            fn ({});
                            break;
                        }
                    }
                    if (data.par.W != undefined) {
                        query(`SELECT ID, ${data.par.W} FROM usuarios WHERE ID='${session.user_info.ID}';`, function(resR) {
                            if (!resR) { if (resR.length < 1) {
                                if (!iprs) {
                                    fn({});
                                    return;
                                }
                            }}
                            var ids = '';

                            artemisa.cLog('!!!!! ---> ' + resR[0][data.par.W])
                            var iprs = secureParse(resR[0][data.par.W]);
                            if (!iprs) {
                                fn({});
                                return;
                            }
                            ids = iprs.join(',');

                            if (!ids.includes('*')) {
                                query(`SELECT ${data.par.I}, ${data.par.C} FROM ${data.par.T} WHERE ${data.par.I} IN (${ids});`, function(res) {
                                    fn({
                                        result: res
                                    });
                                });
                            } else {
                                getCategory(data.par.T, data.par.C, data.par.I, function(res) {
                                    fn({
                                        result: res
                                    });
                                });
                            }
                        });
                    } else {
                        fn({});
                    }
                break;
                case 'news':
                    files.readFile('media/news.html', 'utf-8', function(err, data) {
                        if (!err) {
                            fn({
                                news: data
                            });
                        } else {
                            fn({
                                news: null
                            });
                        }
                    });
                break;
                case 'menu':
                    if (!checkSession(session)) { break; }
                    files.readFile(`site/${session.area}.menu.html`, 'utf-8', function(err, data) {
                        if (!err) {
                            fn({
                                menu: data
                            });
                        } else {
                            fn({
                                menu: null
                            });
                        }
                    });
                    artemisa.cLog('       -> [ Menu Sent ]');
                break;
                case 'myInfo':
                    if (!checkSession(session)) { break; }
                    fn({
                        info: session.user_info,
                        loggedAt: session.area
                    });
                break;
                case 'myChat':
                    if (!checkSession(session)) { break; }
                    var chatWith = data.par.with;
                    query(`SELECT * FROM privatechat WHERE ChatTo = '${session.user_info.ID}' AND ChatFrom = '${chatWith}' OR
                                                            ChatFrom = '${session.user_info.ID}' AND ChatTo = '${chatWith}' ORDER BY 'Time';`, function(resC) {
                        fn({
                            chat: resC
                        });
                        if (resC) { if (resC.length > 0 ) {
                            for(let x = 0; x < resC.length; x++) {
                                query(`UPDATE privatechat SET \`Read\` = 1 WHERE ID = '${resC[x].ID}';`);
                            }
                        }}
                    })
                break;
                case 'unreadC':
                    if (!checkSession(session)) { break; }

                    query(`SELECT ChatFrom, ChatTo, Time FROM privatechat WHERE ChatTo = '${session.user_info.ID}' AND \`Read\` = 0;`, function(resC) {
                        queryList('SELECT Nombre, ID FROM usuarios;', 'ID', function(usersR) {
                            var unread = {};
                            if (resC) { if (resC.length > 0 ) {
                                for(let x = 0; x < resC.length; x++) {
                                    var name = secureParse(usersR[resC[x].ChatFrom].Nombre);
                                    if (!name) {
                                        name = resC[x].ChatFrom;
                                    } else {
                                        if (name[0]) {
                                            name = name[0];
                                        } else {
                                            name = resC[x].ChatFromM;
                                        }
                                    }
                                    if (!unread[name]) {
                                        unread[name] = 1
                                    } else {
                                        unread[name] += 1;
                                    }
                                }
                            }}
                            fn({
                                chat: unread
                            })
                        })
                    })
                break;
                case 'sendPM':
                if (!checkSession(session)) { break; }
                    var chatWith = data.par.with;
                    var msg = data.par.msg;
                    var time = datetimeSQL('now');
                    query(`INSERT INTO privatechat (ChatFrom, ChatTo, Chat, Time) VALUES ('${session.user_info.ID}', '${chatWith}', '${msg}', '${time}');`, function(resC) {
                        if (resC) {
                            emitExactNotification(session.user_info.Usr, [chatWith], msg, {
                                type: 'privatemessage'
                            }, false);
                            fn({
                                success: true
                            })
                        } else {
                            fn({
                                success: false
                            })
                        }
                    });
                break;
                case 'myArea':
                    if (!checkSession(session)) { break; }
                    fn({
                        area: session.area
                    });
                break;
                case 'inventory':
                    if (!checkSession(session)) { break; }
                    queryList(`SELECT ID, Clave, Descripcion FROM cmm_productos;`, 'ID', function(resP) {
                        if (resP) { if (resP.length > 0) {
                            query(`SELECT * FROM cmm_almacen WHERE Disponible = 1;`, function(resN) {
                                if (resN) { if (resN.length > 0) {
                                    var ret = {};
                                    var resp = [];
                                    for (let x = 0; x < resN.length; x) {
                                        if (!resN[x]) continue;
                                        var pr = resP[resN[x].Producto];
                                        if (!pr) continue;

                                        if (ret[pr.Clave]) {
                                            ret[pr.Clave].Cantidad += 1;
                                        } else {
                                            ret[pr.Clave] = {
                                                Cantidad: 1,
                                                Clave: pr.Clave,
                                                Descripcion: pr.Descripcion
                                            }
                                        }
                                    }
                                    for (let y = 0; y < Object.keys(ret).length; y++) {
                                        resp.push({
                                            'Clave Interna': Object.keys(ret)[y],
                                            'Descripción': ret[Object.keys(ret)[y]].Descripcion,
                                            'Cantidad en Inventario': ret[Object.keys(ret)[y]].Cantidad
                                        });
                                    }
                                    fn({
                                        inventory: resp
                                    });
                                } else {
                                    fn({inventory: null});
                                }} else {
                                    fn({inventory: null});
                                }
                            });
                        } else {
                            fn({inventory: null});
                        }} else {
                            fn({inventory: null});
                        }
                    });
                break;
                case 'myNotif':
                    //if (replied) { artemisa.cLog('      --->! Crucial command, cannot replicate.'); break; }
                    if (!checkSession(session)) { break; }
                    var resp = [];
                    var today = moment().hours(0).format('YYYY-MM-DD HH:mm:ss').toString();
                    var todayA = moment().subtract(7, 'days').hours(0).format('YYYY-MM-DD HH:mm:ss').toString();
                    query(`SELECT * FROM notificaciones `/*WHERE Fecha BETWEEN '${datetimeSQL(todayA)}' AND '${datetimeSQL(today)}';*/, function(resN) {
                        getCategoryList('usuarios', 'Nombre', 'ID', function(resU) {
                            for (let n = 0; n < resN.length; n++) {
                                var dest = secureParse(resN[n].Destino);
                                if (!dest) continue;
                                if (dest.includes(session.area)) {
                                        if (resN[n].AtendidoPor == null) {
                                            resN[n].Creador = (secureParse(resU[resN[n].Creador]) ? secureParse(resU[resN[n].Creador])[0] : 'Inválido');
                                            var rawo = secureParse(resN[n].RAW);
                                            if (!rawo) continue;
                                            if (!rawo.folio) rawo.folio = 'N/A';
                                            if (!rawo.docs) rawo.docs = 'N/A';
                                            var what = (rawo.table == 'cmm_ventas' ? 'sales' : (rawo.table == 'cmm_cotizaciones') ? 'ask' : 'exits');
                                            var timeT = moment().diff(moment(resN[n].Fecha), 'hours');
                                            var maxH = Number(consultConfiguration('notificationsLimit', session.area));
                                            var percent = (timeT * 100) / maxH;
                                            var classT = 'success';

                                            if (percent > 20 && percent < 40) {
                                                classT = 'info';
                                            } else if (percent > 40 && percent < 80) {
                                                classT = 'warning';
                                            } else if (percent > 80) {
                                                classT = 'danger';
                                            }

                                            resp.push({
                                                Creador: resN[n].Creador,
                                                Folio: (rawo.folio != 'N/A' ? `<a class="ar action" data-action="filter.Folio.${rawo.folio}.${what}">${rawo.folio}</a>` : rawo.folio),
                                                Datos: resN[n].RAW,
                                                Mensaje: resN[n].Mensaje,
                                                Fecha: resN[n].Fecha,
                                                'Tiempo Transcurrido': `<div class="progress"><div class="progress-bar bg-${classT} progress-bar-striped progress-bar-animated" style="width:${percent}%">${timeT} horas (${(timeT / 24).toFixed(2)} días) transcurridas de ${maxH} (${maxH / 24} días) para buena atención.</div></div>`,
                                                Revisar: `<button class="action" data-action="setNotif.${resN[n].ID}">Marcar Revisada</button>`,
                                                Documentos: rawo.docs
                                            });
                                        }
                                }
                            }
                            fn ({
                                notif: resp
                            });
                        });
                    })
                break;
                case 'setNotif':
                    if (!checkSession(session)) {break;}
                    var ok = {
                        html: '<p>Notificación marcada como revisada.</p>',
                        success: true
                    }
                    var no = {
                        html: '<p>Ocurrió un error al marcar la notificación como revisada.</p>',
                        success: false
                    }
                    query(`SELECT * FROM notificaciones WHERE ID='${data.par.id}'`, function (resN) {
                        if (resN) {
                            if (resN.length > 0) {
                                var raw = secureParse(resN[0].RAW);
                                if (!raw) {
                                    fn(no);
                                    return;
                                }
                                var aquery = '';
                                switch(session.area) {
                                    case 'comm':
                                        aquery = `UPDATE ${raw.table} SET Estado='2' WHERE ID='${raw.backtrace.insertID}';`
                                    break;
                                }
                                query(`UPDATE notificaciones SET AtendidoPor = '${session.user_info.ID}', Atencion = '${datetimeSQL("now")}' WHERE ID='${data.par.id}';`, function(resZ) {
                                    if (resZ) {
                                        fn(ok);
                                    } else {
                                        fn(no);
                                    }
                                });
                            } else {
                                fn(no);
                            }
                        }
                    });
                break;
                case 'query':
                    if (!checkSession(session)) { break; }
                    query(`SELECT * FROM ${data.par.table} WHERE ID='${data.par.id}';`, function(resN) {
                        fn({
                            res: resN[0]
                        })
                    })
                break;
                case 'qrit':
                    if (!checkSession(session)) { break; }
                    fn({
                        tag: qrImageTag(data.par.data)
                    });
                break;
                case 'addEv':
                    if (!checkSession(session)) { break; }
                    query(`INSERT INTO cenas (nombre, razon, email, telefono, sector, proyecto, qr, fecha, ejecutivo) VALUES (
                        '${data.par.nombre}', '${data.par.razon}', '${data.par.email}', '${data.par.telefono}', '${data.par.sector}', '${(data.par.proyecto == "Si" ? '1' : '0')}', '${data.par.qr}', '${dateSQL("now")}', '${data.par.ejecutivo}'
                    )`, function(resE) {
                        if (resE) {
                            fn({
                                success: true
                            });
                        } else {
                            fn({
                                success: false
                            });
                        }
                    });
                break;
                case 'document':
                    if (!checkSession(session)) { break; }
                    query(`SELECT ID, Folio FROM ${data.par.table} WHERE ID='${data.par.id}';`, function(resN) {
                        if (resN) {
                            if (resN.length == 0) {
                                artemisa.cLog(`     ---> Document not found.`);
                                fn({
                                    file: null
                                });
                                return;
                            }
                            artemisa.cLog('     ---> Asking for document ...');
                            files.readdir(lpath + 'documents/gen', function(err, filearr) {
                                if (err) {
                                    fn({
                                        file: null
                                    });
                                    artemisa.cLog(`     ---> Error finding document: ${err.message}`);
                                } else {
                                    artemisa.cLog(`     ---> Document ID: ${resN[0].Folio}`);
                                    for (let d = 0; d < filearr.length; d++) {
                                        var tf = filearr[d];
                                        if (tf.includes(resN[0].Folio)) {
                                            fn({
                                                file: tf.split('/').reverse()[0]
                                            });
                                            artemisa.cLog(`     ---> Document Found: ${resN[0].Folio}`);
                                            return;
                                        }
                                    }
                                    artemisa.cLog(`     ---> Document not found: ${resN[0].Folio}`);
                                    fn({
                                        file: null
                                    });
                                }
                            });
                        }
                    });
                break;
                case 'docuGen':
                    if (!checkSession(session)) { break; }
                    switch(data.par.dtype) {
                        case 'pdf':
                            docuGen('report', data.par.dobj, data.par.dobj.title + '.' + fGen(), function(url) {
                                fn({
                                    file: url
                                })
                            }, 'report', '15mm', '15mm');
                        break;
                        case 'csv':
                        break;
                    }
                break;
                case 'logout':
                    if (artemisa.sessionExists(from)) {
                        artemisa.sessions[from] = undefined;
                        emitCommand(socket, 'redir', {url: '/'});
                    }
                break;
                case 'home':
                    if (!checkSession(session)) { break; }
                    getHome(from, function(res) {
                        fn({
                            obj: res
                        });
                    });
                break;
                case 'nav':
                    if (!checkSession(session)) { break; }
                    var sNav = session.nav;
                    if (sNav == undefined) {
                        artemisa.cLog('         --> corrupted nav, fixing!');
                        sNav = getNav(from, session.area);
                        if (sNav == undefined) {
                            artemisa.cLog('         --! could not be fixed!');
                            fn ({});
                            break;
                        }
                    }
                    sNav.Page(data.par.nav, function(result) {
                        fn ({
                            obj: result
                        });
                    }, null, session.user_info.ID);
                break;
                case 'directory':
                    if (!checkSession(session)) { break; }
                    queryList('SELECT ID, Nombre FROM areas;', 'ID', function(resA) {
                        query(`SELECT ID, Nombre, Perfil, Area FROM usuarios WHERE NOT Acceso LIKE '%absent%' AND NOT Acceso LIKE 'restricted';`, function(resN) {
                            if (resN) {
                                if (resN.length > 0) {
                                    for (let x = 0; x < resN.length; x++) {
                                        if (!secureParse(resN[x].Nombre)) continue;
                                        resN[x].Nombre = secureParse(resN[x].Nombre)[0];
                                        resN[x].Perfil = `<img src="${resN[x].Perfil}" class="profile"/>`;
                                        resN[x].Area = resA[resN[x].Area].Nombre;
                                        resN[x].Chat = `<button class="action" data-action="chat.${resN[x].ID}">Iniciar Chat</button>`
                                    }
                                    fn({
                                        res: resN
                                    })
                                }
                            }
                        });
                    });
                break;
                case 'vacations':
                    if (!checkSession(session)) { break; }
                    query(`SELECT ID, Nombre, Puesto, Sucursal, FechaIngreso, Vacaciones FROM empleados WHERE Activo = 1;`, function(resN) {
                        if (resN) {
                            if (resN.length > 0) {
                                for (let x = 0; x < resN.length; x++) {
                                    var a = moment();
                                    var b = moment(resN[x].FechaIngreso);

                                    var i = Math.floor(a.diff(b, 'years', true));

                                    resN[x].Vacaciones = 0;
                                    if (i >= 1) {
                                        resN[x].Vacaciones = 6;
                                    }
                                    if (i >= 2) {
                                        resN[x].Vacaciones = 8;
                                    }
                                    if (i >= 3) {
                                        resN[x].Vacaciones = 10;
                                    }
                                    if (i >= 4) {
                                        resN[x].Vacaciones = 12;
                                    }
                                    if (i >= 5 && i <= 9) {
                                        resN[x].Vacaciones = 14;
                                    }
                                    if (i >= 10 && i <= 14) {
                                        resN[x].Vacaciones = 16;
                                    }
                                    if (i >= 15 && i <= 19) {
                                        resN[x].Vacaciones = 18;
                                    }
                                    if (i >= 20 && i <= 24) {
                                        resN[x].Vacaciones = 20;
                                    }
                                    if (i >= 25 && i <= 29) {
                                        resN[x].Vacaciones = 22;
                                    }
                                    if (i >= 30 && i <= 34) {
                                        resN[x].Vacaciones = 24;
                                    }
                                    if (i >= 35 && i <= 39) {
                                        resN[x].Vacaciones = 26;
                                    }

                                    query(`UPDATE empleados SET Vacaciones = ${resN[x].Vacaciones} WHERE ID = ${resN[x].ID}`);
                                }
                                fn({
                                    res: resN
                                })
                            }
                        }
                    });
                break;
                case 'filter':
                    if (!checkSession(session)) { break; }
                    var sNav = session.nav;
                    if (sNav == undefined) {
                        artemisa.cLog('         --> corrupted nav, fixing!');
                        sNav = getNav(from, session.area);
                        if (sNav == undefined) {
                            artemisa.cLog('         --! could not be fixed!');
                            fn ({});
                            break;
                        }
                    }
                    sNav.Page(data.par.nav, function(result) {
                        fn ({
                            obj: result
                        });
                    }, data.par.filter, session.user_info.ID);
                break;
                case 'form':
                    if (!checkSession(session)) {break;}
                    files.readFile('forms/' + data.par.form + '.html', 'utf-8', function(err, data) {
                        if (!err) {
                            fn({
                                html: data
                            });
                        } else {
                            artemisa.cLog('!!! -> ' + JSON.stringify(err));
                            fn({
                                html: null
                            });
                        }
                    });
                break;
                case 'askperm':
                    var user = data.par.user;
                    var pass = cryp(data.par.pass);

                    query(`SELECT * FROM usuarios WHERE Usr="${user}" AND Pss="${pass}";`, function(result) {
                        artemisa.cLog(`       -> { looking for: ${user} / ${pass} | asking for permision }`);
                        if (result) { if (result.length > 0) {
                            if (artemisa.sessionExists(from)) {
                                var uaInfo = artemisa.consultAreas(result[0].Acceso)
                                if (!uaInfo.isAdmon) {
                                    fn({
                                        message: 'Acceso denegado.',
                                        success: false
                                    })
                                    artemisa.cLog(`       -: { access denied }`);
                                } else {
                                    fn({
                                        message: `Acceso concedido por ${secureParse(result[0].Nombre)[0]}.`,
                                        success: true
                                    })
                                    artemisa.cLog(`       -: { access ok }`);
                                }
                            } else {
                                fn({
                                    message: 'Sesión inválida.',
                                    success: false
                                })
                                artemisa.cLog(`       -: { invalid session }`);
                            }
                        } else {
                            artemisa.cLog(`       -> { not found }`);
                            fn({
                                message: 'Credenciales incorrectas.',
                                success: false
                            })
                        }
                    }});
                break;
                case 'reToken':
                    getJSON(`https://www.google.com/recaptcha/api/siteverify?secret=6LdEMYUUAAAAAGloMaiaZVloy-RlqoPbNn9Mwpp5&response=${data.par.token}`, function(error, data) {
                        fn (data);
                    })
                break;

                // External (no browser-dependent) instructions
                case 'elogin':
                    var user = data.par.user;
                    var pass = cryp(data.par.pass);
                    var area = 'apanel';
                    if (data.par.area) {
                        area = data.par.area;
                    }

                    query(`SELECT * FROM usuarios WHERE Usr="${user}" AND Pss="${pass}";`, function(result) {
                        artemisa.cLog(`       -> { looking for: ${user} / ${pass} }`);
                        if (result) {
                            if (result.length > 0) {
                                if (artemisa.sessionExists(from)) {
                                    if (!artemisa.consultAreas(result[0].Acceso).isOnArea(area) && !artemisa.consultAreas(result[0].Acceso).isOnArea('total')) {
                                        fn({
                                            message: 'Acceso denegado',
                                            success: false
                                        });
                                        artemisa.cLog(`       -: { access denied }`);
                                    } else {
                                        artemisa.sessions[from].area = area;
                                        artemisa.sessions[from].user_info = result[0];
                                        fn({
                                            message: 'Sesión iniciada',
                                            success: true
                                        });
                                        session = artemisa.sessions[from];
                                        artemisa.cLog(`       -: { logged in }`);
                                    }
                                } else {
                                    fn({
                                        message: 'Sesión inválida',
                                        success: false
                                    })
                                    artemisa.cLog(`       -: { invalid session }`);
                                }
                            } else {
                                artemisa.cLog(`       -> { not found }`);
                                fn({
                                    message: 'Credenciales incorrectas',
                                    success: false
                                })
                            }
                        } else {
                            artemisa.cLog(`       -> { not found }`);
                            fn({
                                message: 'Credenciales incorrectas',
                                success: false
                            })
                        }
                    });
                break;
                case 'enew':
                    if (!checkSession(session)) {break;}
                    if (session.area != 'apanel' && !artemisa.consultAreas(session.user_info.Acceso).isOnArea('total')) {
                        fn({
                            message: 'Acceso denegado',
                            success: false
                        })
                        artemisa.cLog(`       -: { access denied }`);
                    } else {
                        query(`SELECT ID, Usr FROM usuarios WHERE Usr = '${data.par.Usr}';`, function(resX) {
                            if (resX.length == 0) {
                                query(`INSERT INTO usuarios (Nombre, Usr, Pss, Acceso, Correo, Area, Telefono, Empresas) VALUES ('${data.par.Nombre}',
                                '${data.par.Usr}', '${cryp(data.par.Pss)}', '${data.par.Acceso}', '${data.par.Correo}',
                                '${data.par.Area}', '${data.par.Tel}', '${data.par.Emp}');`, function(res) {
                                    if (res) {
                                        fn({
                                            message: 'Usuario creado',
                                            success: true
                                        })
                                        mail({username: data.par.Usr, password: data.par.Pss}, data.par.Correo, 'Te damos la bienvenida', 'newUser.html')
                                        artemisa.cLog('< User Created >');
                                    } else {
                                        fn({
                                            message: `Error al insertar usuario`,
                                            success: false
                                        })
                                        artemisa.cLog(`< Database Query Failed >`);
                                    }
                                });
                            } else {
                                fn({
                                    message: `El usuario ya existe.`,
                                    success: false
                                })
                            }
                        })
                    }
                break;
                case 'emod':
                    if (!checkSession(session)) {break;}
                    if (session.area != 'apanel' && !artemisa.consultAreas(session.user_info.Acceso).isOnArea('total')) {
                        fn({
                            message: 'Acceso denegado',
                            success: false
                        })
                        artemisa.cLog(`       -: { access denied }`);
                    } else {
                        query(`SELECT * FROM usuarios WHERE ID = '${data.par.ID}';`, function(resO) {
                            var squery = `UPDATE usuarios SET Nombre='${data.par.Nombre}', Usr='${data.par.Usr}', Pss='${cryp(data.par.Pss)}',
                            Acceso='${data.par.Acceso}', Correo='${data.par.Correo}', Area='${data.par.Area}' WHERE ID = '${data.par.ID}';`;
                            if (resO.length > 0) {
                                artemisa.cLog(`!!-- ${data.par.Pss} == ${resO[0].Pss} --!!`)
                                if (data.par.Pss == resO[0].Pss) {
                                    squery = `UPDATE usuarios SET Nombre='${data.par.Nombre}', Usr='${data.par.Usr}', Pss='${resO[0].Pss}',
                                    Acceso='${data.par.Acceso}', Correo='${data.par.Correo}', Area='${data.par.Area}', Telefono='${data.par.Tel}',
                                    Empresas='${data.par.Emp}' WHERE ID = '${data.par.ID}';`
                                }
                            }
                            query(squery, function(res) {
                                if (res) {
                                    fn({
                                        message: 'Usuario modificado',
                                        success: true
                                    })
                                    artemisa.cLog('< User modified >');
                                } else {
                                    fn({
                                        message: `Error al modificar el usuario`,
                                        success: false
                                    })
                                    artemisa.cLog(`< Database Query Failed >`);
                                }
                            });
                        });
                    }
                break;
                case 'edel':
                    if (!checkSession(session)) {break;}
                    if (session.area != 'apanel' && !artemisa.consultAreas(session.user_info.Acceso).isOnArea('total')) {
                        fn({
                            message: 'Acceso denegado',
                            success: false
                        })
                        artemisa.cLog(`       -: { access denied }`);
                    } else {
                        query(`DELETE FROM usuarios WHERE ID = '${data.par.ID}';`, function(res) {
                            if (res) {
                                fn({
                                    message: 'Usuario borrado',
                                    success: true
                                })
                                artemisa.cLog('< User deleted >');
                            } else {
                                fn({
                                    message: `Error al borrar al usuario`,
                                    success: false
                                })
                                artemisa.cLog(`< Database Query Failed >`);
                            }
                        });
                    }
                break;
                case 'echoose':
                    if (!checkSession(session)) {break;}
                    if (session.area != 'apanel' && !artemisa.consultAreas(session.user_info.Acceso).isOnArea('total')) {
                        fn({
                            message: 'Acceso denegado',
                            success: false
                        })
                        artemisa.cLog(`       -: { access denied }`);
                    } else {
                        query(`SELECT * FROM usuarios WHERE Usr='${data.par.Usr}' AND Nombre LIKE '%"${data.par.Nombre}"%';`, function(resX) {
                            if (resX) {
                                if (resX.length > 0) {
                                    fn({
                                        message: resX[0],
                                        success: true
                                    })
                                    artemisa.cLog(`< Database Query Success >`);
                                } else {
                                    fn({
                                        message: null,
                                        success: false
                                    })
                                    artemisa.cLog(`< Database Query Null >`);
                                }
                            } else {
                                fn({
                                    message: `Error en la consulta`,
                                    success: false
                                })
                                artemisa.cLog(`< Database Query Failed >`);
                            }
                        });
                    }
                break;
                case 'echooseE':
                    if (!checkSession(session)) {break;}
                    if (session.area != 'apanel' && !artemisa.consultAreas(session.user_info.Acceso).isOnArea('total')) {
                        fn({
                            message: 'Acceso denegado',
                            success: false
                        })
                        artemisa.cLog(`       -: { access denied }`);
                    } else {
                        query(`SELECT * FROM usuarios WHERE Correo='${data.par.mail}';`, function(resX) {
                            if (resX) {
                                if (resX.length > 0) {
                                    fn({
                                        message: resX[0],
                                        success: true
                                    })
                                    artemisa.cLog(`< Database Query Success >`);
                                } else {
                                    fn({
                                        message: null,
                                        success: false
                                    })
                                    artemisa.cLog(`< Database Query Null >`);
                                }
                            } else {
                                fn({
                                    message: `Error en la consulta`,
                                    success: false
                                })
                                artemisa.cLog(`< Database Query Failed >`);
                            }
                        });
                    }
                break;
                case 'elist':
                    if (!checkSession(session)) {break;}
                    if (session.area != 'apanel' && !artemisa.consultAreas(session.user_info.Acceso).isOnArea('total')) {
                        fn({
                            message: 'Acceso denegado',
                            success: false
                        })
                        artemisa.cLog(`       -: { access denied }`);
                    } else {
                        query('SELECT ID, Usr, Acceso FROM usuarios;', function(res) {
                            if (res) {
                                fn({
                                    message: res,
                                    success: true
                                })
                                artemisa.cLog('< Users listed >');
                            } else {
                                fn({
                                    message: `Error al listar a los usuarios`,
                                    success: false
                                })
                                artemisa.cLog(`< Database Query Failed >`);
                            }
                        });
                    }
                break;
                case 'logtail':
                    if (!checkSession(session)) {break;}
                    if (session.area != 'apanel' && !artemisa.consultAreas(session.user_info.Acceso).isOnArea('total')) {
                        fn({
                            message: 'Acceso denegado',
                            success: false
                        })
                        artemisa.cLog(`       -: { access denied }`);
                    } else {
                        readLastLines.read(lpath + artemisa.logname(), 100).then((lines) => fn({ logtail: lines }));
                    }
                break;
                case 'dblogtail':
                    if (!checkSession(session)) {break;}
                    if (session.area != 'apanel' && !artemisa.consultAreas(session.user_info.Acceso).isOnArea('total')) {
                        fn({
                            message: 'Acceso denegado',
                            success: false
                        })
                        artemisa.cLog(`       -: { access denied }`);
                    } else {
                        readLastLines.read(lpath + artemisa.dblogname(), 100).then((lines) => fn({ logtail: lines }));
                    }
                break;
                case 'logsearch':
                    if (!checkSession(session)) {break;}
                    if (session.area != 'apanel' && !artemisa.consultAreas(session.user_info.Acceso).isOnArea('total')) {
                        fn({
                            message: 'Acceso denegado',
                            success: false
                        })
                        artemisa.cLog(`       -: { access denied }`);
                    } else {
                        shell.exec(`grep --include=*.log -rnw '${lpath}' -e "${data.par.filter}"`, function(code, stdout, stderr) {
                            fn({
                                code: code,
                                stdout: stdout,
                                stderr: stderr
                            });
                        });
                    }
                break;
                case 'serverinfo':
                    if (!checkSession(session)) {break;}
                    if (session.area != 'apanel' && !artemisa.consultAreas(session.user_info.Acceso).isOnArea('total')) {
                        fn({
                            message: 'Acceso denegado',
                            success: false
                        })
                        artemisa.cLog(`       -: { access denied }`);
                    } else {
                        var ks = Object.keys(artemisa.sessions);
                        var usrs = [];
                        for (let x = 0; x < ks.length; x++) {
                            if (artemisa.sessions[ks[x]].user_info != undefined) {
                                if (secureParse(artemisa.sessions[ks[x]].user_info.Nombre) != undefined) {
                                    usrs.push({
                                        Name: secureParse(artemisa.sessions[ks[x]].user_info.Nombre)[0],
                                        ID: artemisa.sessions[ks[x]].ip
                                    });
                                }
                            }
                        }
                        fn({
                            session_count: ks.length,
                            logname: artemisa.logname(),
                            session_info: usrs
                        })
                    }
                break;
                case 'calling':
                    if (!checkSession(session)) {break;}
                    var number = data.par.number;
                    var cid = data.par.id;

                    query(``, function(resC) {
                        if (resC) { if (resC.length > 0) {
                            var nseg = secureParse(resC[0].Seguimiento);
                            if (nseg) {
                                nseg[nseg.length] = new Array('En comunicación', `Llamada realizada ${datetimeSQL("now")}`);
                            } else {
                                nseg = [['En comunicación', `Llamada realizada ${datetimeSQL("now")}`]];
                            }
                            query(`UPDATE cmm_clientes SET Seguimiento = '${JSON.stringify(nseg)}' WHERE ID = '${cid}';`, function(resC) {
                                if (resCU) {
                                    fn({
                                        message: 'Llamada registrada.',
                                        success: true
                                    });
                                } else {
                                    fn({
                                        message: 'Error al registrar la llamada.',
                                        success: false
                                    });
                                }
                            });
                        } else {
                            fn({
                                message: 'Error al registrar la llamada.',
                                success: false
                            })
                        }} else {
                            fn({
                                message: 'Error al registrar la llamada.',
                                success: false
                            })
                        }
                    });
                break;
                case 'chat':
                    if (!checkSession(session)) {break;}
                    var cid = data.par.id;

                    fn({
                        html: String(files.readFileSync(lpath + 'forms/chat.html', 'utf8')).replace('{chatWith}', cid)
                    });
                break;

                // Forecast instructions
                case 'notifStats':

                break;

                case 'clientStats':

                break;

                case 'salesStats':

                break;

                case 'askStats':

                break;

                case 'productStats':

                break;

                default:
                    artemisa.cLog('         --> unrecognized command!');
                    fn({})
                break;
            }
        });
        socket.on('chat', function (data, fn) {
            socket.broadcast.emit('chat', data);
            artemisa.cLog(`   -:> [ chat from ${from} as ${session.user_info.Nombre}: '${JSON.stringify(data)}' ]`);
        });
        socket.on('notification', function (data, fn) {
            socket.broadcast.emit('notification', data);
            artemisa.cLog(`   -:> [ notification received from ${from} as ${session.user_info.Nombre} -> '${JSON.stringify(data)}' ]`);
        });
        socket.on('disconnect', function () {
            if (artemisa.sessionExists(from)) {
                artemisa.cLog(`---[ User ${from} as ${session.user_info.Nombre} disconnected and reserving session. ]---`);
            }
        });
    });
});

/**
 * Emits a command to the specified client.
 *
 * Emits a command / instruction to the specified client (as a sockets.io socket object).
 *
 * @param {any} socket Sockets.io socket object to emit the command.
 * @param {String} command Command name.
 * @param {String} response Command parameters/data.
 */
function emitCommand(socket, command, response) {
    socket.emit('command', {
        definition: command,
        response: response
    });
}
/**
 * Request the unique client session ID to the specified client.
 *
 * Request the client unique session ID (as a sockets.io socket object) and awaits for the response, given in the function callback.
 *
 * @param {any} socket Sockets.io socket object to request the session ID.
 * @param {function} callBack Function callback to be invoked when the client responds. Takes one param with the client answer.
 */
function requestID(socket, callBack = function(answer) {}) {
    socket.emit('command', {
        definition: 'id',
        response: null
    }, callBack)
}

// server posts
server.post('/support', upload.any(), function(req, res) {
    artemisa.cLog('   -> { post to: login }');
    var user = req.body.usrname;
    var mess = req.body.message;
    var docs = [];
    for (let f = 0; f < req.files.length; f++) {
        docs.push(req.files[f].destination + '/' + req.files[f].filename);
    }
    var response = new responser();

    query(`SELECT ID FROM usuarios WHERE Usr="${user}";`, function(result) {
        artemisa.cLog(`       -> { looking for: ${user} }`);
        if (result.length > 0) {
            query(`INSERT INTO support (De, Mensaje, Evidencia, Fecha) VALUES ('${result[0].ID}', '${mess}', '${JSON.stringify(docs)}', '${datetimeSQL("now")}')`);
            emitUserNotification(user, ['syst'], mess, {
                documents: docs
            });

            response.setMessage('Su ticket de soporte ha sido recibido. En breve contestaremos sus dudas.')
            artemisa.cLog(`       -: { sent: ${response.stringify()} }`);
            res.send(response.stringify());
        } else {
            artemisa.cLog(`       -> { not found }`);
            response.setMessage('El nombre de usuario ingresado no existe. Su ticket de soporte no ha sido validado.');
            res.send(response.stringify());
        }
    });
});
server.post('/login', upload.array(), function(req, res) {
    artemisa.cLog('   -> { post to: login }');
    var user = req.body.usrname;
    var pass = cryp(req.body.psswd);
    var area = req.body.area;

    var response = new responser();

    var session = req.body.session;
    if (!session) {
        response.setMessage(response.msgTypes.sessionNotFound);
        artemisa.cLog(`       -: { sent: ${response.stringify()} }`);
        res.send(response.stringify());
        return;
    }
    query(`SELECT * FROM usuarios WHERE Usr="${user}" AND Pss="${pass}";`, function(result) {
        artemisa.cLog(`       -> { looking for: ${user} / ${pass} }`);
        if (result) {
            if (result.length > 0) {
                if (artemisa.sessionExists(session)) {
                    if (!artemisa.consultAreas(result[0].Acceso).isOnArea(area) && !artemisa.consultAreas(result[0].Acceso).isOnArea('total')) {
                        response.setMessage('No tienes acceso a esta área. Intente seleccionando otra.');
                    } else {
                        response.categorize(response.actions.Redirect, response.dataTypes.URL);
                        if (area != 'icom') {
                            response.data.url = `../user?s=${session}`;
                        } else {
                            response.data.url = `../icom?s=${session}`;
                        }
                        artemisa.sessions[session].area = area;
                        artemisa.sessions[session].user_info = result[0];
                        if (moment().hour() > Number(consultConfiguration('server', 'dayStart'))) {
                            artemisa.cLog('-----> !!! Day started at ' + Number(consultConfiguration('server', 'dayStart')) + '. Users will stay at the same absent status before.');
                        } else {
                            query(`UPDATE usuarios SET Acceso = '${String(result[0].Acceso).replace(/;absent/g, '')}' WHERE ID = '${result[0].ID}';`);
                        }
                    }
                } else {
                    response.setMessage(response.msgTypes.sessionNotFound);
                }
                artemisa.cLog(`       -: { sent: ${response.stringify()} }`);
                res.send(response.stringify());
            } else {
                artemisa.cLog(`       -> { not found }`);
                response.setMessage(response.msgTypes.incorrectUserOrPassword);
                res.send(response.stringify());
            }
        } else {
            artemisa.cLog(`       -> { not found }`);
            response.setMessage(response.msgTypes.incorrectUserOrPassword);
            res.send(response.stringify());
        }
    });
});
server.post('/newStoreOut', upload.any(), function(req, res) {
    artemisa.cLog('   -> { post to: store }');
    var sale = req.body.sale;
    var edate = req.body.sale;
    var status = req.body.status;
    var pros = req.body.pserie;
    var notes = req.body.notes;

    var docs = [''];
    for (let f = 0; f < req.files.length; f++) {
        docs.push(req.files[f].destination + '/' + req.files[f].filename);
    }

    var response = new responser();

    var session = req.body.session;
    if (!session) {
        response.setMessage(response.msgTypes.sessionNotFound);
        artemisa.cLog(`       -: { sent: ${response.stringify()} }`);
        res.send(response.stringify());
        return;
    }

    if (artemisa.sessionExists(session)) {
        var prosP = secureParse(pros);
        var nProsP = [];

        var letsDoIt = function() {
            query(`SELECT ID, Productos, Folio FROM cmm_ventas WHERE ID = '${sale}';`, function(resSO) {
                if (resSO) { if (resSO.length > 0) {
                    if (nProsP.length > 0) {
                        for (let x = 0; x < nProsP.length; x++) {
                            var tprod = nProsP[x][0];
                            query(`UPDATE cmm_almacen SET Salida = '${dateSQL(edate)}', Disponible = 0 WHERE SKU = '${tprod}';`);
                        }
                        query(`INSERT INTO cmm_almacenSalidas (Venta, Fecha, Estado, Productos, Notas, Folio) VALUES ('${sale}', '${dateSQL(edate)}', '${status}', '${JSON.stringify(nProsP)}', '${notes}', '${resSO[0].Folio}')`, function(resE) {
                            if (resE) {
                                /*var toArea = consultConfiguration('notifications', 'newStoreOut', artemisa.sessions[session].area);

                                emitNotification(session, toArea, 'Nueva salida de almacén.', {
                                    table: 'cmm_almacenSalidas',
                                    backtrace: resE,
                                    origin: artemisa.sessions[session].area,
                                    folio: resSO[0].Folio
                                });*/
                                response.setMessage('Se procesó la salida de forma adecuada.');
                                res.send(response.stringify());
                            } else {
                                for (let x = 0; x < nProsP.length; x++) {
                                    var tprod = nProsP[x][0];
                                    query(`UPDATE cmm_almacen SET Salida = NULL, Disponible = 1 WHERE SKU = '${tprod}';`);
                                }
                                response.setMessage('Ocurrió un error al procesar tus productos.');
                                res.send(response.stringify());
                            }
                        });
                    } else {
                        response.setMessage('Ocurrió un error al procesar tus productos.');
                        res.send(response.stringify());
                    }
                } else {
                    response.setMessage('ID de venta incorrecto.');
                    res.send(response.stringify());
                }} else {
                    response.setMessage('ID de venta incorrecto.');
                    res.send(response.stringify());
                }
            });
        }

        if (prosP) {
            var findThis = '';
            for (let x = 0; x < prosP.length; x++) {
                var tprod = prosP[x];
                if (tprod) { if (tprod != '') {
                    findThis += `SKU = '${tprod}' OR `;
                } } else { continue; }
            }

            if (findThis.length > 2) {
                queryList('SELECT ID, Clave FROM cmm_productos;', 'ID', function(resPr) {
                    query(`SELECT ID, Producto, SKU FROM cmm_almacen WHERE ${findThis.slice(0, findThis.length - 3)};`, function (resEsp) {
                        for (let x = 0; x < resEsp.length; x++) {
                            nProsP[x] = [resEsp[x].SKU, resPr[resEsp[x].Producto].Clave, 'Serie'];
                        }
                        letsDoIt();
                    });
                })
            }
        } else {
            response.setMessage('Ocurrió un error al procesar tus productos.');
            res.send(response.stringify());
        }
    } else {
        response.setMessage(response.msgTypes.sessionNotFound);
        res.send(response.stringify());
    }
});
server.post('/addStore', upload.any(), function(req, res) {
    artemisa.cLog('   -> { post to: store }');
    var pro = req.body.pro;
    var qnt = req.body.qnt;
    var lin = req.body.lin;
    var lsc = req.body.lsc;
    var sku = req.body.sku;
    var ser = req.body.serial;
    var notes = req.body.notes;

    var docs = [];
    for (let f = 0; f < req.files.length; f++) {
        docs.push(req.files[f].destination + '/' + req.files[f].filename);
    }

    var response = new responser();

    var session = req.body.session;
    if (!session) {
        response.setMessage(response.msgTypes.sessionNotFound);
        artemisa.cLog(`       -: { sent: ${response.stringify()} }`);
        res.send(response.stringify());
        return;
    }

    if (artemisa.sessionExists(session)) {
        querify('cmm_almacen', ['Producto', 'Cantidad', 'LInterna', 'LSucursal', 'SKU', 'Serie', 'Notas', 'Barras', 'Entrada'],
        [pro, qnt, lin, lsc, sku, ser, notes, JSON.stringify(docs), dateSQL('now')], undefined,
        function(status, data) {
            if (status == resultStatus.inserted) {
                response.setMessage('El registro se insertó correctamente.');
                res.send(response.stringify());
            } else if (status == resultStatus.modified){
                query(`SELECT * FROM cmm_almacen WHERE ID = '${data.ID}';`, function (resA) {
                    if (resA) { if (resA.length > 0) {
                        var nv = resA[0].Cantidad + Number(qnt);
                        query(`UPDATE cmm_almacen SET Cantidad = '${nv}' WHERE ID = '${data.ID}';`, function (resB) {
                            if (resB) {
                                response.setMessage('El registro se modificó correctamente.');
                                res.send(response.stringify());
                            } else {
                                response.setMessage('El registro no pudo ser modificado.');
                                res.send(response.stringify());
                            }
                        })
                    } else {
                        response.setMessage('El registro no pudo ser modificado.');
                        res.send(response.stringify());
                    }} else {
                        response.setMessage('El registro no pudo ser modificado.');
                        res.send(response.stringify());
                    }
                });
            }
        },
        function(status, data) {
            if (status == resultStatus.query_failed){
                response.setMessage('El registro no pudo ser insertado.');
                res.send(response.stringify());
            }
        }, `SKU = '${sku}'`, false);
    } else {
        response.setMessage(response.msgTypes.sessionNotFound);
        res.send(response.stringify());
    }
});
server.post('/register', upload.array(), function(req, res) {
    artemisa.cLog('   -> { post to: register }');
    var user = req.body.usrname;
    var pass = req.body.psswd;

    var area = req.body.area;
    var fullname = req.body.fullname;
    var email = req.body.email;
    var tel = req.body.tel;
    var ent = req.body.ent;

    var response = new responser();

    var session = req.body.session;
    if (!session) {
        response.setMessage(response.msgTypes.sessionNotFound);
        artemisa.cLog(`       -: { sent: ${response.stringify()} }`);
        res.send(response.stringify());
        return;
    }
    query(`SELECT * FROM usuarios WHERE Usr="${user}";`, function(result) {
        artemisa.cLog(`       -> { looking for: ${user} }`);
        if (result) {
            if (result.length > 0) {
                response.setMessage('El nombre de usuario que especificaste, ya existe. Intenta con otro.');
                artemisa.cLog(`       -: { sent: ${response.stringify()} }`);
                res.send(response.stringify());
            } else {
                artemisa.cLog(`       -> { not found. Sending register. }`);
                mail(req.body, 'diana.ramirez@medicalbuy.mx', '¡Solicitud de usuario!', 'register.html', function(result) {
                    if (result) {
                        response.setMessage('¡Tu solicitud se ha enviado correctamente! por favor, espera un momento a que habilitemos tu cuenta de <i>Artemisa</i>. Llegará un correo de confirmación a la dirección que especificaste cuando tu cuenta sea habilitada. ¡Gracias!');
                        res.send(response.stringify());
                    } else {
                        response.setMessage('Ocurrió un error al procesar tu solicitud. Intenta de nuevo. Si el error persiste, ponte en contacto con el departamento de sistemas.');
                        res.send(response.stringify());
                    }
                });
                var whitelist = consultConfiguration('server', 'registrationAreaWhitelist');
                if (!whitelist) whitelist = [];
                if (whitelist.includes(area)) {
                    query(`SELECT ID, Usr FROM usuarios WHERE Usr = '${user}';`, function(resX) {
                        if (resX.length == 0) {
                            query(`INSERT INTO usuarios (Nombre, Usr, Pss, Acceso, Correo, Area, Telefono, Empresas) VALUES (
                            '{"0": "${fullname}", "${ent}": "${fullname}"}',
                            '${user}', '${cryp(pass)}', '${area + ":rw"}', '{"0": "${email}", "${ent}": "${email}"}',
                            '${area}', '${tel}', '${JSON.stringify([ent])}');`, function(res) {
                                if (res) {
                                    mail({username: user, password: pass}, email, 'Te damos la bienvenida', 'newUser.html')
                                    artemisa.cLog('< User Created >');
                                } else {
                                    artemisa.cLog(`< Database Query Failed >`);
                                }
                            });
                        }
                    });
                }
            }
        } else {
            artemisa.cLog(`       -> { not found }`);
            response.setMessage(response.msgTypes.incorrectUserOrPassword);
            res.send(response.stringify());
        }
    });
});
server.post('/filter', upload.array(), function(req, res) {
    artemisa.cLog('     -> { post to: filter }');
    var c = req.body.column;
    var f = req.body.search;
    var response = new responser();

    var session = req.body.session;
    if (!session) {
        response.setMessage(response.msgTypes.sessionNotFound);
        artemisa.cLog(`       -: { sent: ${response.stringify()} }`);
        res.send(response.stringify());
        return;
    }
    if (artemisa.sessionExists(session)) {
        var nav = artemisa.sessions[session].nav;
        nav.Page(nav.current, function (fres) {
            response.categorize(response.actions.Load, response.dataTypes.HTML);
            response.data.obj = fres;
            res.send(response.stringify());
        }, { column: c, filter: f }, artemisa.sessions[session].user_info.ID);
    } else {
        response.setMessage(response.msgTypes.sessionNotFound);
        res.send(response.stringify());
    }
});

function getTotal(bodyItems) {
    var itms = secureParse(bodyItems);
    var tot = 0;
    var totalized = [];
    for (let it = 0; it < itms.length; it++) {
        if (itms[it].length < 1) continue;
        totalized.push([itms[it][0], itms[it][6], itms[it][1], itms[it][2], itms[it][3], itms[it][4], itms[it][5], '']);
        var iv = totalized[totalized.length - 1][6];
        if (!isNaN(totalized[totalized.length - 1][5])) {
            var itv = Number(totalized[totalized.length - 1][5]) * Number(totalized[totalized.length - 1][1])
            if (iv == 'on' || iv == 1 || iv == 'true') {
                var fiv = itv * 0.16;
                totalized[totalized.length - 1][6] = formatMoney( (fiv).toFixed(2) );
                totalized[totalized.length - 1][7] = formatMoney( (itv + (fiv)).toFixed(2) );
                tot += (itv + (fiv));
            } else {
                totalized[totalized.length - 1][6] = 'No';
                totalized[totalized.length - 1][7] = formatMoney( (itv).toFixed(2) );
                tot += itv;
            }
            totalized[totalized.length - 1][5] = formatMoney(totalized[totalized.length - 1][5]);
        }
    }

    return (tot).toFixed(2);
}

/**
 * Generates an object, for HTML templates, to be used at pdf document generator; specifically for invoice documents-
 *
 * @param {Object} body req.body object from HTTP post/request variables.
 * @param {Array} resultc Database query result from clients table for client information.
 * @param {Array} resultb Database query result from companies table for company information such as name, logo, css schema and header HTML.
 * @param {String} from User unique session ID.
 * @param {Number} invoiceID Recently generated invoice ID from database insertion query.
 * @param {String} logo Logo ID (commonly 'req.body.logo').
 * @param {Array} headers Header names to replace at invoice product table.
 */
function documentObject(body, resultc, resultb, from, invoiceID = '1', logo = '1', headers = ['ID', 'Cantidad', 'Clave Interna', 'Marca', 'Descripción', 'Precio', 'IVA', 'Subtotal', 'Información Extra']) {
    var docuO = body;
    var udata = artemisa.sessions[from].user_info;
    docuO.logo = logo;
    docuO.lpath = lpath;
    docuO.client = resultc[0].Nombre + '<br />' + resultc[0].CTelefono + '<br />' + resultc[0].CCorreo;
    docuO.today = datetimeSQL('now');
    try {
        docuO.uname = secureParse(udata.Nombre)[logo] + '<br />' + udata.Telefono + '<br />' + secureParse(udata.Correo)[logo];
        docuO.dserial = xfGen(secureParse(udata.Nombre)[logo], invoiceID);
    } catch (error) {
        docuO.uname = 'Ejecutivo' + '<br />' + udata.Telefono + '<br />' + ' ';
        docuO.dserial = xfGen('Ejecutivo Inválido', invoiceID);
    }
    var itms = secureParse(body.items);
    docuO.items = [];
    docuO.items.push(headers);
    var tot = 0;
    for (let it = 0; it < itms.length; it++) {
        if (itms[it].length < 1) continue;
        if (itms[it].length > 7) {
            docuO.items.push([itms[it][0], itms[it][6], itms[it][1], itms[it][2], itms[it][3], itms[it][4], itms[it][5], '', itms[it][7]]);
        } else {
            docuO.items.push([itms[it][0], itms[it][6], itms[it][1], itms[it][2], itms[it][3], itms[it][4], itms[it][5], '', '']);
        }
        var iv = docuO.items[docuO.items.length - 1][6];
        if (!isNaN(docuO.items[docuO.items.length - 1][5])) {
            var itv = Number(docuO.items[docuO.items.length - 1][5]) * Number(docuO.items[docuO.items.length - 1][1])
            if (iv == 'on' || iv == 1 || iv == 'true') {
                var fiv = itv * 0.16;
                docuO.items[docuO.items.length - 1][6] = formatMoney( (fiv).toFixed(2) );
                docuO.items[docuO.items.length - 1][7] = formatMoney( (itv + (fiv)).toFixed(2) );
                tot += (itv + (fiv));
            } else {
                docuO.items[docuO.items.length - 1][6] = 'No';
                docuO.items[docuO.items.length - 1][7] = formatMoney( (itv).toFixed(2) );
                tot += itv;
            }
            docuO.items[docuO.items.length - 1][5] = formatMoney(docuO.items[docuO.items.length - 1][5]);
        }
    }
    docuO.items.push(['', '', '', '', '', '', 'Total', formatMoney( (tot).toFixed(2)) ]);
    docuO.total = (tot).toFixed(2);

    if (resultb) { if (resultb.length > 0) {
        docuO.logo_name = resultb[0].Nombre;
        docuO.logo_header = resultb[0].Header;
        docuO.logo_css = resultb[0].CSS;
    } }
    return docuO;
}
server.post(['/postSale', '/editSale', '/editSaleA'], upload.any(), function(req, res) {
    artemisa.cLog('     -> { post to: sale mod }');
    var client = req.body.client;
    var date = dateSQL(req.body.sdate);
    var notes = req.body.notes;
    var items = req.body.items;
    var arr = req.body.arr;
    var paq = req.body.paq;
    var docs = [];
    for (let f = 0; f < req.files.length; f++) {
        docs.push(req.files[f].destination + '/' + req.files[f].filename);
    }
    var intern = req.body.intern;
    var id = req.body.ID;
    var guia = req.body.guia;
    var logo = req.body.logo;
    var cfdi = req.body.cfdi;
    var mpay = req.body.mpay;
    var fpay = req.body.fpay;

    var response = new responser();

    if (isNaN(client)) {
        response.setMessage('ID de cliente inválido.');
        artemisa.cLog(`       -: { sent: ${response.stringify()} }`);
        res.send(response.stringify());
        return;
    } else if (client < 1) {
        response.setMessage('ID de cliente inválido.');
        artemisa.cLog(`       -: { sent: ${response.stringify()} }`);
        res.send(response.stringify());
        return;
    }

    var session = req.body.session;
    if (!session) {
        response.setMessage(response.msgTypes.sessionNotFound);
        artemisa.cLog(`       -: { sent: ${response.stringify()} }`);
        res.send(response.stringify());
        return;
    }
    if (artemisa.sessionExists(session)) {
        var myID = artemisa.sessions[session].user_info.ID;
        if (isNaN(myID)) {
            response.setMessage('ID de usuario inválido. Por favor, cierre sesión e inicie nuevamente.');
            artemisa.cLog(`       -: { sent: ${response.stringify()} }`);
            res.send(response.stringify());
            return;
        } else if (myID < 1) {
            response.setMessage('ID de usuario inválido. Por favor, cierre sesión e inicie nuevamente.');
            artemisa.cLog(`       -: { sent: ${response.stringify()} }`);
            res.send(response.stringify());
            return;
        }
        var fquery = `SELECT * FROM cmm_ventas WHERE Cliente = '${client}' AND Fecha = '${date}' AND Ejecutivo = '${myID}' AND Productos = '${items}';`;
        if (id) {
            fquery = `SELECT * FROM cmm_ventas WHERE ID = '${id}';`;
        }
        query(`SELECT * FROM cmm_clientes WHERE ID = ${client}`,  function(resultc) {
            if (resultc) { if (resultc.length > 0) {
            if (
                resultc[0].RazonSocial != undefined && resultc[0].RazonSocial != '' &&
                resultc[0].RFC != undefined && resultc[0].RFC != '' &&
                resultc[0].Domicilio != undefined && resultc[0].Domicilio != '' &&
                resultc[0].Ciudad != undefined && resultc[0].Ciudad != '' &&
                resultc[0].Municipio != undefined && resultc[0].Municipio != '' &&
                resultc[0].Estado != undefined && resultc[0].Estado != '' &&
                resultc[0].CP != undefined && resultc[0].CP != '' &&
                resultc[0].Correo != undefined && resultc[0].Correo != '' &&
                resultc[0].Telefono != undefined && resultc[0].Telefono != ''
                ) {
            query(`SELECT * FROM empresas WHERE ID = "${logo}";`, function(resultb) {
            query(fquery, function (resq) {
                if (resq.length == 0) {
                    if (docs.length < 1) {
                        response.setMessage('No has adjuntado ningún documento o comprobante. Para enviar tu venta, es necesario que adjuntes todos los documentos y comprobantes de pago relacionados con tu venta. Para añadirlos, presiona el botón "Añadir Archivo", y selecciona cada uno de los documentos.');
                        res.send(response.stringify());
                        return;
                    }
                    query(`INSERT INTO cmm_ventas (Cliente, Fecha, Productos, Arrendadora, Paqueteria, Estado, Documentos, Notas, Folio, Ejecutivo, Interno, Total, Logo, CFDI, MPAY, FPAY) VALUES
                    ('${client}', '${date}', '${items}', '${arr}', '${paq}', '1', '${JSON.stringify(docs)}', '${notes}', 'INVALID', '${myID}', '${intern}', '0', '${logo}', '${cfdi}', '${mpay}', '${fpay}');`,
                    function(inres) {
                        if (inres) {
                            var docuO = documentObject(req.body, resultc, resultb, session, inres.insertId, logo);
                            docuGen('sale', docuO, `Venta${docuO.dserial}`, function(durl) {
                                sendSMS(cleanTel(resultc[0].CTelefono),
                                `¡Felicidades por su nuevo producto! El folio de su compra es ${docuO.dserial}.`);
                                var pSeguimiento = secureParse(resultc[0].Seguimiento);
                                if (pSeguimiento) {
                                    pSeguimiento[pSeguimiento.length] = new Array("Venta",`Nueva venta con folio ${docuO.dserial}`);
                                } else {
                                    pSeguimiento = [["Venta",`Nueva venta con folio ${docuO.dserial}`]];
                                }
                                query(`UPDATE cmm_clientes SET Seguimiento = '${JSON.stringify(pSeguimiento)}' WHERE ID = '${client}'`);

                                response.data.file = durl;
                                response.setMessage('El registro se insertó correctamente.')
                                /*var toArea = ['sadmon', 'sadmong'];
                                if (artemisa.sessions[session].area == 'salesu') toArea = ['sadmonu', 'sadmong'];
                                if (artemisa.sessions[session].area == 'meison') toArea = ['sadmonm', 'sadmong'];*/
                                var toArea = consultConfiguration('notifications', 'postSale', artemisa.sessions[session].area);

                                emitNotification(session, toArea, '<span class="alert-light">Nueva venta</span>', {
                                    table: 'cmm_ventas',
                                    backtrace: inres,
                                    origin: artemisa.sessions[session].area,
                                    folio: docuO.dserial
                                });
                                res.send(response.stringify());
                            });
                            query(`UPDATE cmm_ventas SET Folio = '${docuO.dserial}', Total = '${docuO.total}' WHERE ID = '${inres.insertId}';`);
                        } else {
                            response.setMessage('El registro no pudo ser insertado.')
                            res.send(response.stringify());
                        }
                    });
                } else {
                    /*if (String(req.body.estado).trim().toLowerCase() == String(resq[0].Estado).trim().toLowerCase()) {
                        response.setMessage('La venta seleccionada ya está en ese estado. No se actualizará.');
                        res.send(response.stringify());
                        return;
                    }
                    if (docs.length < 1 && (artemisa.sessions[session].area.includes('fact'))) {
                        response.setMessage('No has adjuntado ningún documento o comprobante. Para actualizar el estado de tu venta, es necesario que adjuntes todos los documentos y comprobantes de pago / compra relacionados con tu venta. Para añadirlos, presiona el botón "Añadir Archivo", y selecciona cada uno de los documentos.');
                        res.send(response.stringify());
                        return;
                    }*/

                    var ndocs = secureParse(resq[0].Documentos);
                    if (!ndocs) ndocs = [];
                    if (!Array.isArray(ndocs)) {
                        ndocs = [ndocs];
                    }

                    docs = docs.concat(ndocs);

                    queryList('SELECT ID, Clase FROM cmm_ventaPrioridades;', 'ID', function(vPrioridad) {
                        var lquery = `UPDATE cmm_ventas SET Fecha = '${date}', Productos = '${items}', Total = '${getTotal(items)}', Arrendadora = '${arr}', Paqueteria = '${paq}', Documentos = '${JSON.stringify(docs)}', Notas = '${notes}', Interno = '${intern}', Logo = '${logo}', CFDI = '${cfdi}', MPAY = '${mpay}', FPAY = '${fpay}', Prioridad = '${req.body.prioridad}' WHERE Cliente = '${client}' AND Fecha = '${date}' AND Ejecutivo = '${myID}' AND Productos = '${items}';`;
                        if (id) {
                            if (guia != undefined) {
                                lquery = `UPDATE cmm_ventas SET Productos = '${items}', Total = '${getTotal(items)}', Estado = '${req.body.estado}', Fecha = '${date}', Arrendadora = '${arr}', Paqueteria = '${paq}', Documentos = '${JSON.stringify(docs)}', Notas = '${notes}', Guia = '${guia}', Interno = '${intern}', Logo = '${logo}', CFDI = '${cfdi}', MPAY = '${mpay}', FPAY = '${fpay}', Prioridad = '${req.body.prioridad}' WHERE ID = '${id}';`;
                            } else {
                                lquery = `UPDATE cmm_ventas SET Productos = '${items}', Total = '${getTotal(items)}', Estado = '${req.body.estado}', Fecha = '${date}', Arrendadora = '${arr}', Paqueteria = '${paq}', Documentos = '${JSON.stringify(docs)}', Notas = '${notes}', Interno = '${intern}', Logo = '${logo}', CFDI = '${cfdi}', MPAY = '${mpay}', FPAY = '${fpay}', Prioridad = '${req.body.prioridad}' WHERE ID = '${id}';`;
                            }
                        }
                        queryList(`SELECT ID, Nombre FROM cmm_ventaEstados;`, 'ID', function(Estados) {
                            query(lquery, function(inres) {
                                if (inres && !artemisa.sessions[session].area.includes('sales')) {
                                    query(`SELECT ID, Acceso FROM usuarios WHERE ID = ${resq[0].Ejecutivo}`, function(resE) {
                                        var toArea = consultConfiguration('notifications', 'postSale.Status', req.body.estado);
                                        if (!toArea) {
                                            toArea = (artemisa.consultAreas(resE[0].Acceso).isOnArea('salesu') ? ['sadmonu', 'sadmong']:['sadmon', 'sadmong']);
                                            if (artemisa.consultAreas(resE[0].Acceso).isOnArea('meison')) toArea = ['sadmonm', 'sadmong'];
                                        }

                                        response.setMessage('El registro se modificó correctamente.');
                                        inres.insertId = id;
                                        if (toArea.length > 0) {
                                            emitNotification(session, toArea, '<span class="' + vPrioridad[req.body.prioridad].Clase + '">' + 'Actualización de venta: ' + Estados[req.body.estado].Nombre + '</span>', {
                                                table: 'cmm_ventas',
                                                backtrace: inres,
                                                origin: artemisa.sessions[session].area,
                                                folio: resq[0].Folio
                                            });
                                            emitExactNotification(artemisa.sessions[session].user_info.Usr, [resq[0].Ejecutivo], `Actualización de venta con folio (${resq[0].Folio})`,
                                            {
                                                table: 'cmm_ventas',
                                                backtrace: inres,
                                                origin: artemisa.sessions[session].area,
                                                folio: resq[0].Folio
                                            });
                                        }

                                        res.send(response.stringify());
                                    });
                                } else {
                                    response.setMessage('El registro no pudo ser modificado.');
                                    res.send(response.stringify());
                                }
                            });
                        });
                    });
                }
            });
            });
        } else {
            response.setMessage('Todos los datos de facturación deben estar completos antes de enviar una venta. Completa los datos de facturación de tu cliente dando clic en el botón "Modificar cliente".')
            res.send(response.stringify());
        }

        } else {
            response.setMessage('ID de Cliente inválido.')
            res.send(response.stringify());
        }}

        });
    } else {
        response.setMessage(response.msgTypes.sessionNotFound);
        res.send(response.stringify());
    }
});
server.post('/postAsk', upload.any(), function(req, res) {
    artemisa.cLog('     -> { post to: sale mod }');
    var client = req.body.client;
    var date = dateSQL(req.body.sdate);
    var notes = req.body.notes;
    var items = req.body.items;
    var arr = req.body.arr;
    var paq = req.body.paq;
    var docs = [];
    for (let f = 0; f < req.files.length; f++) {
        docs.push(req.files[f].destination + '/' + req.files[f].filename);
    }
    var id = req.body.ID;
    var intern = req.body.intern;
    var logo = req.body.logo;
    var response = new responser();

    if (isNaN(client)) {
        response.setMessage('ID de cliente inválido.');
        artemisa.cLog(`       -: { sent: ${response.stringify()} }`);
        res.send(response.stringify());
        return;
    } else if (client < 1) {
        response.setMessage('ID de cliente inválido.');
        artemisa.cLog(`       -: { sent: ${response.stringify()} }`);
        res.send(response.stringify());
        return;
    }

    var session = req.body.session;
    if (!session) {
        response.setMessage(response.msgTypes.sessionNotFound);
        artemisa.cLog(`       -: { sent: ${response.stringify()} }`);
        res.send(response.stringify());
        return;
    }
    if (artemisa.sessionExists(session)) {
        var myID = artemisa.sessions[session].user_info.ID;
        if (isNaN(myID)) {
            response.setMessage('ID de usuario inválido. Por favor, cierre sesión e inicie nuevamente.');
            artemisa.cLog(`       -: { sent: ${response.stringify()} }`);
            res.send(response.stringify());
            return;
        } else if (myID < 1) {
            response.setMessage('ID de usuario inválido. Por favor, cierre sesión e inicie nuevamente.');
            artemisa.cLog(`       -: { sent: ${response.stringify()} }`);
            res.send(response.stringify());
            return;
        }
        var fquery = `SELECT * FROM cmm_cotizaciones WHERE Cliente = '${client}' AND Fecha = '${date}' AND Ejecutivo = '${myID}' AND Productos = '${items}';`;
        if (id) {
            fquery = `SELECT * FROM cmm_cotizaciones WHERE ID = '${id}';`;
        }
        query(`SELECT * FROM cmm_clientes WHERE ID = ${client}`,  function(resultc) {
            if (resultc) { if (resultc.length > 0) {
                query(`SELECT * FROM empresas WHERE ID = "${logo}";`, function(resultb) {
                    query(fquery, function (resq) {
                        if (resq.length == 0) {
                            query(`INSERT INTO cmm_cotizaciones (Cliente, Fecha, Productos, Arrendadora, Paqueteria, Estado, Documentos, Notas, Folio, Ejecutivo, Interno, Total, Logo)
                                                        VALUES ('${client}', '${date}', '${items}', '${arr}', '${paq}', '1', '${JSON.stringify(docs)}', '${notes}', 'INVALID', '${myID}', '${intern}', '0', '${logo}');`,
                            function(inres) {
                                if (inres) {
                                    var docuO = documentObject(req.body, resultc, resultb, session, inres.insertId, logo);
                                    docuGen('ask', docuO, `Cotizacion${docuO.dserial}`, function(durl) {
                                        var pSeguimiento = secureParse(resultc[0].Seguimiento);
                                        if (pSeguimiento) {
                                            pSeguimiento[pSeguimiento.length] = new Array('Cotizando',`Nueva cotización con folio ${docuO.dserial}`);
                                        } else {
                                            pSeguimiento = [['Cotizando',`Nueva cotización con folio ${docuO.dserial}`]];
                                        }
                                        query(`UPDATE cmm_clientes SET Seguimiento = '${JSON.stringify(pSeguimiento)}' WHERE ID = '${client}'`);

                                        response.data.file = durl;
                                        response.setMessage('El registro se insertó correctamente.')
                                        res.send(response.stringify());
                                    });
                                    query(`UPDATE cmm_cotizaciones SET Folio = '${docuO.dserial}', Total = '${docuO.total}' WHERE ID = '${inres.insertId}';`);
                                } else {
                                    response.setMessage('El registro no pudo ser insertado.')
                                    res.send(response.stringify());
                                }
                            });
                        } else {
                            var ndocs = secureParse(resq[0].Documentos);
                            if (!ndocs) ndocs = [];
                            if (!Array.isArray(ndocs)) {
                                ndocs = [ndocs];
                            }

                            docs = docs.concat(ndocs);
                            var lquery = `UPDATE cmm_cotizaciones SET Fecha = '${date}', Productos = '${items}', Arrendadora = '${arr}', Paqueteria = '${paq}', Documentos = '${JSON.stringify(docs)}', Notas = '${notes}', Interno = '${intern}', Logo = '${logo}' WHERE Cliente = '${client}' AND Fecha = '${date}' AND Ejecutivo = '${myID}' AND Productos = '${items}';`;
                            if (id) {
                                lquery = `UPDATE cmm_cotizaciones SET Fecha = '${date}', Productos = '${items}', Arrendadora = '${arr}', Paqueteria = '${paq}', Documentos = '${JSON.stringify(docs)}', Notas = '${notes}', Interno = '${intern}', Logo = '${logo}' WHERE ID = '${id}';`;
                            } else {
                                id = resq[0].ID
                            }
                            query(lquery,
                            function(inres) {
                                if (inres) {
                                    var docuO = documentObject(req.body, resultc, resultb, session, id, logo);
                                    if (inres) {
                                        docuGen('ask', docuO, `Cotizacion${docuO.dserial}`, function(durl) {
                                            response.data.file = durl;
                                            response.setMessage('El registro se modificó correctamente.')
                                            inres.insertId = id;
                                            res.send(response.stringify());
                                        });
                                        query(`UPDATE cmm_cotizaciones SET Total = '${docuO.total}' WHERE ID = '${id}';`);
                                    } else {
                                        response.setMessage('El registro no pudo ser modificado.')
                                        res.send(response.stringify());
                                    }
                                } else {
                                    response.setMessage('El registro no pudo ser modificado.')
                                    res.send(response.stringify());
                                }
                            })
                        }
                    });
                });
            } else {
                response.setMessage('ID de cliente inválido.')
                res.send(response.stringify());
            }}
        });
    } else {
        response.setMessage(response.msgTypes.sessionNotFound);
        res.send(response.stringify());
    }
});
server.post(['/newClient', '/newClientA', '/editClient'], upload.any(), function(req, res) {
    artemisa.cLog(JSON.stringify(req.body));
    var modcategoria = req.body.modCategoria, modespecialidad = req.body.modEspecialidad, modrazon = req.body.modRazon;
    var modrfc = req.body.modRFC, moddomicilio = req.body.modDomicilio, modciudad = req.body.modCiudad, modmunicipio = req.body.modMunicipio;
    var modestado = req.body.modEstado, modcp = req.body.modCP, modcorreo = req.body.modCorreo, modtel = req.body.modTel;
    var modnombre = req.body.modNombre, modcdomicilio = req.body.modCDomicilio, modcciudad = req.body.modCCiudad;
    var modcmunicipio = req.body.modCMunicipio, modcestado = req.body.modCEstado, modccp = req.body.modCCP, modccorreo = req.body.modCCorreo;
    var modctel = req.body.modCTel, modnotas = req.body.modNotas;

    var seguimiento = secureParse(req.body.seguimiento);

    var response = new responser();
    var session = req.body.session;
    if (!session) {
        response.setMessage(response.msgTypes.sessionNotFound);
        artemisa.cLog(`       -: { sent: ${response.stringify()} }`);
        res.send(response.stringify());
        return;
    }
    var id = req.body.ID;

    if (artemisa.sessionExists(session)) {
        var modExe = (req.body.modExe != undefined ? req.body.modExe : artemisa.sessions[session].user_info.ID);
        if (modExe == '') {
            if (!artemisa.consultAreas(artemisa.sessions[session].user_info.Acceso).isAdmon) {
                response.setMessage(response.msgTypes.sessionNotFound);
                artemisa.cLog(`       -: { sent: ${response.stringify()} }`);
                res.send(response.stringify());
            } else {
                req.body.nombre = req.body.modNombre;
                req.body.email = req.body.modCCorreo;
                req.body.telefono = req.body.modCTel;

                autoAsign(req.body, function(asData) {
                    modExe = asData;

                    var mailPrefix = consultConfiguration('mail', 'newClientDefaultMailPrefix');
                    var mailPostfix = consultConfiguration('autoasign', req.body.origin)['mail'];
                    if (!mailPostfix) mailPostfix = String(req.body.origin).replace('www.', '');

                    if (isNaN(asData)) {
                        // req.body.producto = req.body.producto;
                        // req.body.comentarios = req.body.comentarios;
                        req.body.exe = asData;
                        // req.body.origin = req.body.origin;
                        mail(req.body, `${mailPrefix}@${mailPostfix}; ${consultConfiguration('mail', 'newClientDefaultMailNotificationCC')};`, 'Nuevo prospecto', 'prospect.html', function() {});
                        response.setMessage('Prospecto asignado a ' + asData + '.');
                        res.send(response.stringify());
                    } else {
                        query(`SELECT Nombre, Correo, ID FROM usuarios WHERE ID = ${modExe};`, function(resE) {
                            if (!resE) { return; }
                            if (resE.length < 1) { return; }
                            var exe_mail = secureParse(resE[0].Correo)[0];
                            var exe = secureParse(resE[0].Nombre)[0];
                            // req.body.producto = req.body.producto;
                            // req.body.comentarios = req.body.comentarios;
                            req.body.exe = exe;
                            emitExactNotification(artemisa.sessions[session].user_info.ID, [modExe], 'Nuevo prospecto', {
                                table: 'cmm_clientes',
                                backtrace: resE,
                                origin: artemisa.sessions[session].area
                            });
                            // req.body.origin = req.body.origin;
                            mail(req.body, `${mailPrefix}@${mailPostfix}; ${exe_mail}; ${consultConfiguration('mail', 'newClientDefaultMailNotificationCC')};`, 'Nuevo prospecto', 'prospect.html', function() {});
                            response.setMessage('Prospecto asignado a ' + exe + '.');
                            res.send(response.stringify());
                        });
                    }
                });
            }
        } else {
            querify('cmm_clientes',
            ['RazonSocial', 'RFC', 'Domicilio', 'Ciudad', 'Municipio', 'Estado', 'CP', 'Correo', 'Telefono', 'Nombre', 'CDomicilio', 'CCiudad', 'CMunicipio', 'CEstado', 'CCP', 'CCorreo', 'CTelefono', 'Categoria', 'Subcategoria', 'Notas', 'Ejecutivo', 'Seguimiento', 'Tags'],
            [modrazon, modrfc, moddomicilio, modciudad, modmunicipio, modestado, modcp, modcorreo, modtel, modnombre, modcdomicilio, modcciudad, modcmunicipio, modcestado, modccp, modccorreo, modctel, modcategoria, modespecialidad, modnotas , modExe, (seguimiento ? JSON.stringify(seguimiento) : JSON.stringify([['Nota', 'Primer registro efectivo el ' + datetimeSQL('now') + '.']])), JSON.stringify(['Manual'])],
            id,
            function(status, data) {
                if (status == resultStatus.inserted) {
                    if (artemisa.consultAreas(artemisa.sessions[session].user_info.Acceso).isAdmon) {
                        query(`SELECT Nombre, Correo, ID FROM usuarios WHERE ID = ${modExe};`, function(resE) {
                            if (!resE) { return; }
                            if (resE.length < 1) { return; }
                            var exe_mail = secureParse(resE[0].Correo)[0];
                            var exe = secureParse(resE[0].Nombre)[0];
                            req.body.nombre = req.body.modNombre;
                            req.body.email = req.body.modCCorreo;
                            req.body.telefono = req.body.modCTel;
                            // req.body.producto = req.body.producto;
                            // req.body.comentarios = req.body.comentarios;
                            req.body.exe = exe;
                            // req.body.origin = req.body.origin;
                            mail(req.body, `${exe_mail}; ${consultConfiguration('mail', 'newClientDefaultMailNotificationCC')};`, 'Nuevo prospecto', 'prospect.html', function() {});
                        });
                        emitExactNotification(artemisa.sessions[session].user_info.ID, [modExe], 'Nuevo prospecto', {
                            table: 'cmm_clientes',
                            backtrace: data,
                            origin: artemisa.sessions[session].area
                        });
                    }

                    response.setMessage('El registro se insertó correctamente.');
                    res.send(response.stringify());
                } else if (status == resultStatus.modified){
                    if (seguimiento) seguimiento[seguimiento.length] = new Array('Nota', 'Actualización registrada el ' + datetimeSQL('now') + '.'); else seguimiento = [['Nota', 'Primer registro efectivo el ' + datetimeSQL('now') + '.']];
                    query(`UPDATE cmm_clientes SET Seguimiento = '${JSON.stringify(seguimiento)}' WHERE ID = '${data.ID}';`)

                    response.setMessage('El registro se modificó correctamente.');
                    res.send(response.stringify());
                }
            },
            function(status, data) {
                if (status == resultStatus.row_found) {
                    response.setMessage('El registro no pudo ser insertado, ya existe un cliente con el mismo correo electrónico.');
                } else if (status == resultStatus.query_failed){
                    response.setMessage('El registro no pudo ser insertado.')
                }
                res.send(response.stringify());
            }, `Correo = '${modccorreo}'`, true);
        }
    } else {
        response.setMessage(response.msgTypes.sessionNotFound);
        res.send(response.stringify());
    }
});
server.post('/sendPM', upload.any(), function(req, res) {
    var response = new responser();

    var chatWith = req.body.with;
    var msg = req.body.msg;
    var time = datetimeSQL('now');

    var docs = [];
    if (req.files) {
        for (let f = 0; f < req.files.length; f++) {
            docs.push(req.files[f].destination + '/' + req.files[f].filename);
        }
    }

    var session = req.body.session;
    if (!session) {
        response.setMessage(response.msgTypes.sessionNotFound);
        artemisa.cLog(`       -: { sent: ${response.stringify()} }`);
        res.send(response.stringify());
        return;
    }

    if (artemisa.sessionExists(session)) {
        if (msg == '' || !msg) {
            response.categorize(response.actions.Dialog, response.dataTypes.HTML);
            response.data.html = String(files.readFileSync(lpath + 'forms/chat.html', 'utf8')).replace('{chatWith}', chatWith);
            res.send(response.stringify());
        } else {
            query(`INSERT INTO privatechat (ChatFrom, ChatTo, Chat, Time) VALUES ('${artemisa.sessions[session].user_info.ID}', '${chatWith}', '${msg}', '${time}');`, function(resC) {
                if (resC) {
                    emitExactNotification(artemisa.sessions[session].user_info.Usr, [chatWith], msg, {
                        type: 'privatemessage'
                    }, false);
                    response.categorize(response.actions.Dialog, response.dataTypes.HTML);
                    response.data.html = String(files.readFileSync(lpath + 'forms/chat.html', 'utf8')).replace('{chatWith}', chatWith);
                    res.send(response.stringify());
                } else {
                    response.setMessage('No pudimos enviar tu mensaje.');
                    res.send(response.stringify());
                }
            });
        }
    } else {
        response.setMessage(response.msgTypes.sessionNotFound);
        res.send(response.stringify());
    }
});
server.post('/profile', upload.any(), function(req, res) {
    var response = new responser();

    var docs = [];
    if (req.files) {
        for (let f = 0; f < req.files.length; f++) {
            docs.push(req.files[f].destination + '/' + req.files[f].filename);
        }
    } else {
        response.setMessage('Sin archivo.');
        res.send(response.stringify());
        return;
    }

    var session = req.body.session;
    if (!session) {
        response.setMessage(response.msgTypes.sessionNotFound);
        artemisa.cLog(`       -: { sent: ${response.stringify()} }`);
        res.send(response.stringify());
        return;
    }

    if (artemisa.sessionExists(session)) {
        query(`SELECT ID, Perfil FROM usuarios WHERE ID = '${artemisa.sessions[session].user_info.ID}';`, function(tQ) {
            if (tQ) { if (tQ.length > 0) {
                query(`UPDATE usuarios SET Perfil = '${docs[0]}' WHERE ID = '${artemisa.sessions[session].user_info.ID}';`, function(uQ) {
                    if (uQ) {
                        response.setMessage('Cambiamos tu foto de perfil.');
                        res.send(response.stringify());
                    }
                });
            } else {
                response.setMessage(response.msgTypes.sessionNotFound);
                res.send(response.stringify());
            }} else {
                response.setMessage(response.msgTypes.sessionNotFound);
                res.send(response.stringify());
            }
        })
    } else {
        response.setMessage(response.msgTypes.sessionNotFound);
        res.send(response.stringify());
    }
});
server.post('/createNotif', upload.any(), function(req, res) {
    var table = req.body.table;
    var docs = [];
    var type = req.body.type;
    var notes = req.body.notes;
    for (let f = 0; f < req.files.length; f++) {
        docs.push(req.files[f].destination + '/' + req.files[f].filename);
    }
    var id = req.body.ID;

    var response = new responser();
    var session = req.body.session;
    if (!session) {
        response.setMessage(response.msgTypes.sessionNotFound);
        artemisa.cLog(`       -: { sent: ${response.stringify()} }`);
        res.send(response.stringify());
        return;
    }

    if (artemisa.sessionExists(session)) {
        query(`SELECT * FROM ${table} WHERE ID = '${id}';`, function(tQ) {
            if (tQ) { if (tQ.length > 0) {
                //var toArea = ['sadmon', 'sadmong'];
                var inres = {};
                inres.insertId = id;
                //if (artemisa.sessions[session].area == 'salesu') toArea = ['sadmonu', 'sadmong'];
                //if (artemisa.sessions[session].area == 'meison') toArea = ['sadmonm', 'sadmong'];
                var toArea = consultConfiguration('notifications', 'createNotif', artemisa.sessions[session].area);
                emitNotification(session, toArea, `<span class="alert-light">${type}: ${notes};</span>`, {
                    table: table,
                    backtrace: inres,
                    origin: artemisa.sessions[session].area,
                    folio: tQ[0].Folio,
                    docs: docs,
                    type: type
                });
                response.setMessage('Se emitió la notificación.');
                res.send(response.stringify());
            } else {
                response.setMessage('No se emitió la notificación.');
                res.send(response.stringify());
            }} else {
                response.setMessage('No se emitió la notificación.');
                res.send(response.stringify());
            }
        })
    } else {
        response.setMessage(response.msgTypes.sessionNotFound);
        res.send(response.stringify());
    }
});
server.post('/newBioChison', upload.any(), function(req, res) {
    var serial = req.body.serial;
    var oDate = dateSQL(req.body.sdate);
    var days = req.body.days;
    var notes = req.body.notes;
    var rev = req.body.rev;
    var snum = req.body.snum;
    var response = new responser();

    var session = req.body.session;
    if (!session) {
        response.setMessage(response.msgTypes.sessionNotFound);
        artemisa.cLog(`       -: { sent: ${response.stringify()} }`);
        res.send(response.stringify());
        return;
    }

    if (artemisa.sessionExists(session)) {
        querify('bio_chison',
        ['Serie', 'Fecha', 'Dias', 'Notas', 'Revision', 'ProductoSerie'],
        [serial, oDate, days, notes, rev, snum],
        undefined,
        function(status, data) {
            if (status == resultStatus.inserted) {
                response.setMessage('El registro se insertó correctamente.')
            } else if (status == resultStatus.modified){
                response.setMessage('El registro se modificó correctamente.')
            }
            res.send(response.stringify());
        },
        function(status, data) {
            if (status == resultStatus.row_found) {
                response.setMessage('El registro no pudo ser insertado, ya existe una revisión de la misma venta.');
            } else if (status == resultStatus.query_failed){
                response.setMessage('El registro no pudo ser insertado.')
            }
            res.send(response.stringify());
        }, `Serie = '${serial}' AND Fecha = '${oDate}'`);
    } else {
        response.setMessage(response.msgTypes.sessionNotFound);
        res.send(response.stringify());
    }
});
server.post(['/postBioRev', '/voidBioRev', '/editBioRev'], upload.any(), function(req, res) {
    var i = 0;
    var products = req.body.pserie;

    var entrada = dateSQL(req.body.sdate);
    var salida = dateSQL(req.body.edate);
    var venta = req.body.venta;
    var encargado = req.body.client;
    var notas = req.body.notes;
    var estado = req.body.estado;

    var response = new responser();

    var session = req.body.session;
    if (!session) {
        response.setMessage(response.msgTypes.sessionNotFound);
        artemisa.cLog(`       -: { sent: ${response.stringify()} }`);
        res.send(response.stringify());
        return;
    }
    var id = req.body.ID;

    if (artemisa.sessionExists(session)) {
        if (salida != NaN) {
            if (!encargado) encargado = artemisa.sessions[session].user_info.ID;
        }
        querify('cmm_biomedica',
        ['Entrada', 'Salida', 'ProductoSerie', 'Venta', 'Encargado', 'Notas', 'Estado'],
        [entrada, (salida == NaN ? 'NULL' : salida), products, (venta ? venta : 'NULL'), encargado, notas, estado],
        id,
        function(status, data) {
            if (status == resultStatus.inserted) {
                response.setMessage('El registro se insertó correctamente.')
                query(`SELECT Folio, ID FROM cmm_ventas WHERE ID='${venta}'`, function(resV) {
                    if (resV) { if (resV.length > 0) {
                        emitNotification(session, consultConfiguration('notifications', 'postBioRev', 'default'), 'Nueva revisión.', {
                            table: 'cmm_ventas',
                            backtrace: data,
                            origin: artemisa.sessions[session].area,
                            folio: resV[0].Folio
                        });
                    }}
                });
            } else if (status == resultStatus.modified) {
                response.setMessage('El registro se modificó correctamente.')
            }
            res.send(response.stringify());
        },
        function(status, data) {
            if (status == resultStatus.row_found) {
                response.setMessage('El registro no pudo ser insertado, ya existe una revisión de la misma venta.');
            } else if (status == resultStatus.query_failed){
                response.setMessage('El registro no pudo ser insertado.')
            }
            res.send(response.stringify());
        }, `Venta = '${venta}'`, true);
    } else {
        response.setMessage(response.msgTypes.sessionNotFound);
        res.send(response.stringify());
    }
});
server.post(['/editProduct', '/newProduct'], upload.any(), function(req, res) {
    var cat = req.body.cat;
    var scat = req.body.scat;
    var bra = req.body.bra;
    var prov = req.body.prov;
    var sat = req.body.sat;
    var clave = req.body.clave;
    var desc = req.body.desc;
    var curr = req.body.curr;
    var costo = req.body.costo;
    var prt = req.body.prt;
    var prcc = req.body.prcc;
    var dat = req.body.dat;
    var iva = req.body.iva;
    var id = req.body.ID;
    var response = new responser();

    var session = req.body.session;
    if (!session) {
        response.setMessage(response.msgTypes.sessionNotFound);
        artemisa.cLog(`       -: { sent: ${response.stringify()} }`);
        res.send(response.stringify());
        return;
    }
    if (artemisa.sessionExists(session)) {
        artemisa.cLog('---> ATTENTION!! ' + id);
        querify('cmm_productos',
        ['Categoria', 'Subcategoria', 'Marca', 'Proveedor', 'SAT', 'Clave', 'Descripcion', 'Moneda', 'Costo', 'VentaTienda', 'VentaCC', 'Datos', 'IVA'],
        [cat, scat, bra, prov, sat, clave, desc, curr, costo, prt, prcc, dat, (iva == "on" || iva == 1 || iva == "true" ? 1 : 0)],
        id,
        function(status, data) {
            if (status == resultStatus.inserted) {
                response.setMessage('El registro se insertó correctamente.')
                res.send(response.stringify());
            } else if (status == resultStatus.modified) {
                response.setMessage('El registro se modificó correctamente.')
                res.send(response.stringify());
            }
        },
        function(status, data) {
            if (status == resultStatus.row_found) {
                response.setMessage('El registro no pudo ser insertado, ya existe un producto con la misma clave interna.')
                res.send(response.stringify());
            } else if (status == resultStatus.query_failed) {
                response.setMessage('El registro no pudo ser insertado.')
                res.send(response.stringify());
            }
        },
        `Clave = '${clave}'`, true);
    } else {
        response.setMessage(response.msgTypes.sessionNotFound);
        res.send(response.stringify());
    }
});
server.post(['/voidInc', '/newInc', '/editInc'], upload.any(), function(req, res) {
    var empl = req.body.empl;
    var jus = [];
    for (let f = 0; f < req.files.length; f++) {
        jus.push(req.files[f].destination + '/' + req.files[f].filename);
    }
    var dat = dateSQL(req.body.sdate);
    var obs = req.body.obs;
    var id = req.body.ID;
    var response = new responser();

    var session = req.body.session;
    if (!session) {
        response.setMessage(response.msgTypes.sessionNotFound);
        artemisa.cLog(`       -: { sent: ${response.stringify()} }`);
        res.send(response.stringify());
        return;
    }
    if (artemisa.sessionExists(session)) {
        querify('faltas',
        ['Empleado', 'Justificante', 'Fecha', 'Observacion'],
        [empl, JSON.stringify(jus), dat, obs],
        id,
        function(status, data) {
            if (status == resultStatus.inserted) {
                response.setMessage('El registro se insertó correctamente.')
                res.send(response.stringify());
            } else if (status == resultStatus.modified) {
                response.setMessage('El registro se modificó correctamente.')
                res.send(response.stringify());
            }
        },
        function(fail) {
            response.setMessage('El registro no pudo ser insertado.')
            res.send(response.stringify());
        },
        `Empleado='${empl}' AND Fecha='${dat}'`);
    } else {
        response.setMessage(response.msgTypes.sessionNotFound);
        res.send(response.stringify());
    }
});
server.post(['/newVacation'], upload.any(), function(req, res) {
    var empl = req.body.empl;
    var days = req.body.days;
    var sdate = dateSQL(req.body.sdate);

    var id = req.body.ID;
    var response = new responser();

    var session = req.body.session;
    if (!session) {
        response.setMessage(response.msgTypes.sessionNotFound);
        artemisa.cLog(`       -: { sent: ${response.stringify()} }`);
        res.send(response.stringify());
        return;
    }
    if (artemisa.sessionExists(session)) {
        query(`SELECT ID, Vacaciones FROM empleados WHERE ID = '${empl}';`, function(resV) { // getting total available vacation days
            query (`SELECT ID, Dias FROM vacaciones WHERE Empleado = '${empl}' AND ;`, function(resE) { // getting total last registered vacation days
                if (resV) { if (resV.length > 0) {
                    var lastV = 0;
                    var maxE = (resE ? resE.length : 0);

                    for (let x = 0; x < maxE; x++) {
                        lastV += Number(resE[x].Dias);
                    }

                    if (lastV + days > Number(resV[0].Vacaciones)) {
                        response.setMessage('Total de días excedido. No se agregará el registro.');
                        res.send(response.stringify());
                        return;
                    }

                    querify('vacaciones',
                    ['Empleado', 'Fecha', 'Dias'],
                    [empl, sdate, days],
                    id,
                    function(status, data) {
                        if (status == resultStatus.inserted) {
                            response.setMessage('El registro se insertó correctamente. Quedan ' + String(Number(resV[0].Vacaciones - (lastV + days))) + ' días restantes.');
                            res.send(response.stringify());
                        } else if (status == resultStatus.modified) {
                            response.setMessage('El registro se modificó correctamente. Quedan ' + String(Number(resV[0].Vacaciones - (lastV + days))) + ' días restantes.');
                            res.send(response.stringify());
                        }
                    },
                    function(fail) {
                        response.setMessage('El registro no pudo ser insertado.')
                        res.send(response.stringify());
                    },
                    `Empleado='${empl}' AND Fecha='${sdate}'`);
                } else {
                    response.setMessage('Empleado inválido.')
                    res.send(response.stringify());
                }} else {
                    response.setMessage('Empleado inválido.')
                    res.send(response.stringify());
                }
            });
        });
    } else {
        response.setMessage(response.msgTypes.sessionNotFound);
        res.send(response.stringify());
    }
});
server.post(['/newTel'], upload.any(), function(req, res) {
    var empl = req.body.empl;
    var tel = req.body.tel;
    var serial = req.body.serial;
    var estado = req.body.estado;
    var sdate = dateSQL(req.body.sdate);
    var contra = req.body.contra;
    var device = req.body.device;
    var plan = req.body.plan;
    var rent = req.body.rent;
    var imei = req.body.imei;
    var mail = req.body.mail;
    var pass = req.body.pass;

    var id = req.body.ID;
    var response = new responser();

    var session = req.body.session;
    if (!session) {
        response.setMessage(response.msgTypes.sessionNotFound);
        artemisa.cLog(`       -: { sent: ${response.stringify()} }`);
        res.send(response.stringify());
        return;
    }
    if (artemisa.sessionExists(session)) {
        querify('telefonos',
        ['Empleado', 'Numero', 'Serie', 'Estado', 'Inicio', 'Periodo', 'Equipo', 'Plan', 'Renta', 'IMEI', 'Correo', 'Password'],
        [empl, tel, serial, estado, sdate, contra, device, plan, rent, imei, mail, pass],
        id,
        function(status, data) {
            if (status == resultStatus.inserted) {
                response.setMessage('El registro se insertó correctamente.')
                res.send(response.stringify());
            } else if (status == resultStatus.modified) {
                response.setMessage('El registro se modificó correctamente.')
                res.send(response.stringify());
            }
        },
        function(fail) {
            response.setMessage('El registro no pudo ser insertado.')
            res.send(response.stringify());
        },
        `Empleado='${empl}' AND Numero='${tel}'`);
    } else {
        response.setMessage(response.msgTypes.sessionNotFound);
        res.send(response.stringify());
    }
});
server.post(['/newEmpl', '/editEmpl', '/editEmplB'], upload.any(), function(req, res) {
    var nombre = req.body.nombre;
    var curp = req.body.curp;
    var rfc = req.body.rfc;
    var nss = req.body.nss;
    var nacimiento = dateSQL(req.body.nacimiento);
    var ingreso = dateSQL(req.body.ingreso);
    var domicilio = req.body.domicilio;
    var puesto = req.body.puesto;
    var sueldo = req.body.sueldo;
    var tarjeta = req.body.tarjeta;
    var sucursal = req.body.sucursal;
    var sangre = req.body.sangre;
    var alergias = req.body.alergias;
    var activo = req.body.activo; // Checkbox
    var telefono = req.body.telefono;
    var correo = req.body.correo;
    var idencorp = req.body.niden;
    var referencia = req.body.referencia;
    var id = req.body.ID;

    var docs = [];
    for (let f = 0; f < req.files.length; f++) {
        docs.push(req.files[f].destination + '/' + req.files[f].filename);
    }
    var response = new responser();

    var session = req.body.session;
    if (!session) {
        response.setMessage(response.msgTypes.sessionNotFound);
        artemisa.cLog(`       -: { sent: ${response.stringify()} }`);
        res.send(response.stringify());
        return;
    }
    if (artemisa.sessionExists(session)) {
        querify('empleados',
        ['Nombre', 'CURP', 'RFC', 'NSS', 'Nacimiento', 'FechaIngreso', 'Domicilio', 'Puesto', 'Sueldo', 'Tarjeta', 'Sucursal', 'Sangre', 'Alergias', 'Activo', 'TelCorp', 'MailCorp', 'IdenCorp', 'Documentos', 'Referencia'],
        [nombre, curp, rfc, nss, nacimiento, ingreso, domicilio, puesto, sueldo, tarjeta, sucursal, sangre, alergias, (activo == "on" || activo == 1 || activo == "true" ? 1 : 0), telefono, correo, idencorp, JSON.stringify(docs), referencia],
        id,
        function(status, data) {
            if (status == resultStatus.inserted) {
                response.setMessage('El registro se insertó correctamente.')
                res.send(response.stringify());
            } else if (status == resultStatus.modified) {
                response.setMessage('El registro se modificó correctamente.')
                res.send(response.stringify());
            }
        },
        function(fail) {
            response.setMessage('El registro no pudo ser insertado.')
            res.send(response.stringify());
        },
        `Nombre='${nombre}' AND CURP='${curp}'`
        )
    } else {
        response.setMessage(response.msgTypes.sessionNotFound);
        res.send(response.stringify());
    }
});

server.post('/postGuest', upload.any(), function(req, res) {
    var nombre = req.body.nombre;
    var razon = req.body.razon;
    var email = req.body.email;
    var telefono = req.body.telefono;
    var sector = req.body.sector;
    var proyecto = req.body.proyecto;
    var fecha = dateSQL('now');
    var ejecutivo = req.body.ejecutivo;

    query(`SELECT ID, Nombre FROM usuarios WHERE ID='${ejecutivo}';`, function(ex) {
        if (ex) { if (ex.length > 0) {
            var info = {
                Nombre: nombre,
                RazonSocial: razon,
                Correo: email,
                Telefono: telefono,
                Sector: sector,
                Proyecto: proyecto,
                Fecha: fecha,
                Ejecutivo: secureParse(ex[0].Nombre)[0]
            };
            var qr = qrGen(JSON.stringify(info, undefined, 4));
            query(`INSERT INTO cenas (nombre, razon, email, telefono, sector, proyecto, qr, fecha, ejecutivo) VALUES (
                '${nombre}', '${razon}', '${email}', '${telefono}', '${sector}', '${(proyecto == "Si" ? '1' : '0')}', '${qr[1]}', '${fecha}', '${ejecutivo}'
            )`, function(resE) {
                if (resE) { if (resE.insertId > 0) {
                    res.send({success: true});
                    info.qr = qr[0];
                    mail(info, email, 'Invitado al Evento', 'newGuest.html', function() {}, false, '"Eventos Medicalbuy" <cenas@medicalbuy.mx>', consultConfiguration('mail', 'postGuest'));
                }} else {
                    files.unlinkSync(qr[0]);
                    res.send({success: false});
                }
            });
        }}
    })
});
server.post('/announce', upload.any(), function(req, res) {
    var msg = req.body.announce;
    var tit = req.body.title;

    var response = new responser();
    var session = req.body.session;
    if (!session) {
        response.setMessage(response.msgTypes.sessionNotFound);
        artemisa.cLog(`       -: { sent: ${response.stringify()} }`);
        res.send(response.stringify());
        return;
    }

    if (artemisa.sessionExists(session)) {
        var ndata = {
            type: 'announce',
            title: tit,
            message: msg
        }
        io.emit('notification', ndata);
        response.setMessage('Emitida');
        res.send(response.stringify());
    } else {
        response.setMessage(response.msgTypes.sessionNotFound);
        res.send(response.stringify());
    }
});

function autoAsign(data, asigned, sms = true) {
    var nombre = data.nombre;
    var email = String(data.email).trim().toLowerCase();
    var tel = data.telefono;
    var notes = data.comentarios;
    var prod = data.producto;
    var ent = 1;
    var extraOrigin = (String(data.origin).includes('www') ? 'web': 'natural');

    if (String(data.origin).includes(',')) {
        var sOrigin = String(data.origin).split(',', 2);
        if (sOrigin.length >= 2) {
            data.origin = sOrigin[0].trim().replace('www.', '').trim().toLowerCase();
            extraOrigin = sOrigin[1].trim().toLowerCase();
        } else {
            data.origin = String(data.origin).trim().replace('www.', '').trim().toLowerCase();
        }
    } else {
        data.origin = String(data.origin).trim().replace('www.', '').trim().toLowerCase();
    }

    var mailPrefix = consultConfiguration('mail', 'newClientDefaultMailPrefix');

    var autoConfig = consultConfiguration('autoasign', data.origin);
    var mailPostfix = String(data.origin).replace('www.', '');

    var ultrasource = false;
    var extra = "NOT Acceso LIKE '%foreign%'";
    data.reason = 'Coincidencia con empresa, origen o producto encontrada.';

    if (autoConfig) {
        if (autoConfig.ent) {
            ent = autoConfig.ent;
            extra = autoConfig.extra;
            ultrasource = autoConfig.ultrasource;
            if (autoConfig.mail) mailPostfix = autoConfig.mail;
        } else {
            if (autoConfig[prod]) {
                ent = autoConfig[prod].ent;
                extra = autoConfig[prod].extra;
                ultrasource = autoConfig[prod].ultrasource;
                if (autoConfig[prod].mail) mailPostfix = autoConfig[prod].mail;
            }
        }
    }

    var asign = function() {
        var session = data.session;
        if (!session) {
            artemisa.cLog(`       -: { invalid API call }`);
            return;
        }
        var squery = `SELECT ID, Nombre, Empresas, Telefono, Correo, Acceso FROM usuarios WHERE Empresas LIKE '%"${ent}"%' AND Acceso LIKE 'sales%' AND NOT Acceso LIKE 'salesu%' AND NOT Acceso LIKE '%ger%' AND NOT Acceso LIKE '%absent' AND NOT Acceso LIKE '%restricted%' ${extra.includes('OR') ? extra : 'AND ' + extra};`;
        if (String(prod).toLowerCase().includes('ultrasonido') || ultrasource) {
            squery = `SELECT ID, Nombre, Empresas, Telefono, Correo, Acceso FROM usuarios WHERE Empresas LIKE '%"${ent}"%' AND Acceso LIKE 'salesu%' AND NOT Acceso LIKE '%ger%' AND NOT Acceso LIKE '%absent' AND NOT Acceso LIKE '%restricted%' ${extra.includes('OR') ? extra : 'AND ' + extra};`;
        }

        query(squery, function(resX) {
            if (resX) { if (resX.length > 0) {
                var nexe = exeoffset % resX.length;
                if (nexe == NaN) nexe = 0;

                var exe = secureParse(resX[nexe].Nombre)[ent];
                var exe_mail = secureParse(resX[nexe].Correo)[ent];
                var exe_tel = resX[nexe].Telefono;
                var exe_id = resX[nexe].ID;

                var doExe = function() {
                    data.exe = exe;

                    if (sms) sendSMS(cleanTel(tel),
                    `Bienvenido a ${data.origin}! ${exe} se comunicara con usted.`);

                    sendSMS(cleanTel(exe_tel),
                    `Has recibido un nuevo prospecto. Informacion en tu correo ${exe_mail}`);

                    mail(data, `${mailPrefix}@${mailPostfix}; ${exe_mail}; ${consultConfiguration('mail', 'newClientDefaultMailNotificationCC')};`, 'Nuevo prospecto', 'prospect.html', function() {});
                    exeoffset++; files.writeFileSync('exeoffset', String(exeoffset), 'utf8');
                    asigned(exe_id);
                }
                var doExeTel = function() {
                    data.exe = exe;

                    if (sms) sendSMS(cleanTel(tel),
                    `Bienvenido a ${data.origin}! En breve nos comunicaremos con usted.`);

                    sendSMS(cleanTel(exe_tel),
                    `Has recibido un nuevo prospecto. Informacion en tu correo ${exe_mail}`);

                    mail(data, `${mailPrefix}@${mailPostfix}; ${exe_mail}; ${consultConfiguration('mail', 'newClientDefaultMailNotificationCC')};`, 'Nuevo prospecto', 'prospect.html', function() {});
                    exeoffset++; files.writeFileSync('exeoffset', String(exeoffset), 'utf8');
                    asigned(exe_id);
                }

                var querifyVals = [nombre, email, tel, `Producto solicitado: ${prod}. Comentarios del cliente: ${notes}`, resX[nexe].ID, JSON.stringify(['AutoAsign', ent, data.origin, extraOrigin])];
                querify('cmm_clientes',
                ['Nombre', 'CCorreo', 'CTelefono', 'Notas', 'Ejecutivo', 'Tags'],
                querifyVals,
                undefined,
                function(status, dataf) {
                    if (status == resultStatus.inserted) {
                        data.reason = 'Coincidencia con empresa, origen o producto encontrada. Nuevo cliente.';
                        artemisa.cLog(`       -: { Auto-prospect ${nombre} inserted }`);

                        doExe();
                    } else if (status == resultStatus.modified) {
                        data.reason = 'Coincidencia con empresa, origen o producto encontrada. Cliente previo.';
                        artemisa.cLog(`       -: { Auto-prospect ${nombre} modified }`);

                        doExe();
                    }
                },
                function(status, dataf) {
                    if (status == resultStatus.row_found) {
                        artemisa.cLog(`       -: { Auto-prospect ${nombre} yet asigned }`);

                        query(`SELECT Tags, Ejecutivo, CCorreo FROM cmm_clientes WHERE CCorreo = '${dataf[0].CCorreo}';`, function (resCl) {
                            if (resCl) {
                                if (resCl.length > 0) {
                                    var yetAsigned = false;
                                    for (let c = 0; c < resCl.length; c++) {
                                        var tags = secureParse(resCl[c].Tags);
                                        if (tags) {
                                            if (tags.length > 1) {
                                                if (tags[1] == ent) {

                                                    query(`SELECT Nombre, Correo, Telefono, Acceso, ID FROM usuarios WHERE ID = '${dataf[0].Ejecutivo}'`, function(resExe) {
                                                        if (resExe) { if (resExe.length > 0) {
                                                            if (!artemisa.consultAreas(resExe[0].Acceso).isAbsent && !artemisa.consultAreas(resExe[0].Acceso).isRestricted) {
                                                                exe = secureParse(resExe[0].Nombre)[0];
                                                                exe_mail = secureParse(resExe[0].Correo)[0];
                                                                exe_tel = resExe[0].Telefono;
                                                                data.reason = 'Cliente previo.<br /><strong>Clave de consulta:</strong><code>' + cryp(querifyVals) + '</code>';

                                                                doExeTel();
                                                            } else {
                                                                yetAsigned = true;

                                                                query(`INSERT INTO cmm_clientes (Nombre, CCorreo, CTelefono, Notas, Ejecutivo, Tags) VALUES (
                                                                    '${nombre}', '${email}', '${tel}', 'Producto solicitado: ${prod}. Comentarios del cliente: ${notes}', '${resX[nexe].ID}', '${JSON.stringify(['AutoAsign', ent, data.origin, extraOrigin])}'
                                                                )`, function (resNCl) {
                                                                    if (resNCl) {
                                                                        data.reason = 'Cliente previo. Reasignado por estado de ausencia o restricción.<br /><strong>Clave de consulta:</strong><code>' + cryp(querifyVals) + '</code>';
                                                                        artemisa.cLog(`       -: { Auto-prospect ${nombre} modified }`);

                                                                        doExe();
                                                                    }
                                                                });
                                                            }
                                                        } else {
                                                            data.exe = 'No asignado.';

                                                            if (sms) sendSMS(cleanTel(tel),
                                                            `Bienvenido a ${data.origin}! En breve nos comunicaremos con usted.`);
                                                            data.reason = 'Cliente previo. No reasignado por falta de ejecutivos.<br /><strong>Clave de consulta:</strong><code>' + cryp(querifyVals) + '</code>';

                                                            mail(data, `${mailPrefix}@${mailPostfix}; ${exe_mail}; ${consultConfiguration('mail', 'newClientDefaultMailNotificationCC')};`, 'Nuevo prospecto', 'prospect.html', function() {});
                                                            asigned(resExe[0].ID);
                                                        }} else {
                                                            data.exe = 'No asignado.';

                                                            if (sms) sendSMS(cleanTel(tel),
                                                            `Bienvenido a ${data.origin}! En breve nos comunicaremos con usted.`);
                                                            data.reason = 'Consulta fallida. Cliente previo, no reasignado.<br /><strong>Clave de consulta:</strong><code>' + cryp(querifyVals) + '</code>';

                                                            mail(data, `${mailPrefix}@${mailPostfix}; ${exe_mail}; ${consultConfiguration('mail', 'newClientDefaultMailNotificationCC')};`, 'Nuevo prospecto', 'prospect.html', function() {});
                                                            asigned(data.exe);
                                                        }
                                                    });

                                                    yetAsigned = true;
                                                    break;
                                                }
                                            }
                                        }
                                    }

                                    if (!yetAsigned) {
                                        query(`INSERT INTO cmm_clientes (Nombre, CCorreo, CTelefono, Notas, Ejecutivo, Tags) VALUES (
                                            '${nombre}', '${email}', '${tel}', 'Producto solicitado: ${prod}. Comentarios del cliente: ${notes}', '${resX[nexe].ID}', '${JSON.stringify(['AutoAsign', ent, data.origin, extraOrigin])}'
                                        )`, function (resNCl) {
                                            if (resNCl) {
                                                data.reason = 'Cliente previo.<br /><strong>Clave de consulta:</strong><code>' + cryp(querifyVals) + '</code>';
                                                artemisa.cLog(`       -: { Auto-prospect ${nombre} modified }`);

                                                doExe();
                                            }
                                        });
                                    }
                                } else {
                                    query(`INSERT INTO cmm_clientes (Nombre, CCorreo, CTelefono, Notas, Ejecutivo, Tags) VALUES (
                                        '${nombre}', '${email}', '${tel}', 'Producto solicitado: ${prod}. Comentarios del cliente: ${notes}', '${resX[nexe].ID}', '${JSON.stringify(['AutoAsign', ent, data.origin, extraOrigin])}'
                                    )`, function (resNCl) {
                                        if (resNCl) {
                                            data.reason = 'Cliente previo. Sin resultados de consulta.<br /><strong>Clave de consulta:</strong><code>' + cryp(querifyVals) + '</code>';
                                            artemisa.cLog(`       -: { Auto-prospect ${nombre} modified }`);

                                            doExe();
                                        }
                                    });
                                }
                            } else {
                                query(`INSERT INTO cmm_clientes (Nombre, CCorreo, CTelefono, Notas, Ejecutivo, Tags) VALUES (
                                    '${nombre}', '${email}', '${tel}', 'Producto solicitado: ${prod}. Comentarios del cliente: ${notes}', '${resX[nexe].ID}', '${JSON.stringify(['AutoAsign', ent, data.origin, extraOrigin])}'
                                )`, function (resNCl) {
                                    if (resNCl) {
                                        data.reason = 'Cliente previo. Consulta fallida.<br /><strong>Clave de consulta:</strong><code>' + cryp(querifyVals) + '</code>';
                                        artemisa.cLog(`       -: { Auto-prospect ${nombre} modified }`);

                                        doExe();
                                    }
                                });
                            }
                        });
                    } else if (status == resultStatus.query_failed){
                        data.reason = 'Cliente previo. Consulta fallida.<br /><strong>Clave de consulta:</strong><code>' + cryp(querifyVals) + '</code>';
                        artemisa.cLog(`       -: { Auto-prospect ${nombre} not asigned and insertion failed }`);

                        doExe();
                    }
                }, `CCorreo = '${email}'`, true);
            } else {
                data.exe = 'No asignado.';

                if (sms) sendSMS(cleanTel(tel),
                `Bienvenido a ${data.origin}! En breve nos comunicaremos con usted.`);
                data.reason = 'No se encontró ejecutivo sin ausencia o restricción.<br /><strong>Clave de consulta:</strong><code>' + cryp(squery) + '</code>';

                mail(data, `${mailPrefix}@${mailPostfix}; ${exe_mail}; ${consultConfiguration('mail', 'newClientDefaultMailNotificationCC')};`, 'Nuevo prospecto', 'prospect.html', function() {});
                asigned(data.exe);
            }} else {
                data.exe = 'No asignado.';

                if (sms) sendSMS(cleanTel(tel),
                `Bienvenido a ${data.origin}! En breve nos comunicaremos con usted.`);
                data.reason = 'Consulta fallida.<br /><strong>Clave de consulta:</strong><code>' + cryp(squery) + '</code>';

                mail(data, `${mailPrefix}@${mailPostfix}; ${exe_mail}; ${consultConfiguration('mail', 'newClientDefaultMailNotificationCC')};`, 'Nuevo prospecto', 'prospect.html', function() {});
                asigned(data.exe);
            }
        });
    }

    var edoSet = function(edo) {
        if (autoConfig.static) { return; }
        var edoConfig = consultConfiguration('edoasign', String(edo).toLowerCase().trim());

        if (edoConfig) {
            if (edoConfig.extra) { extra = edoConfig.extra; }
            if (edoConfig.ent) { ent = edoConfig.ent; }
        }
    }

    var lada = String(cleanTel(tel)).slice(2, 5);
    if (lada) {
        query(`SELECT Nombre, LADA FROM lada WHERE LADA LIKE '${lada}%';`, function(resL) {
            if (resL) { if (resL.length > 0) {
                data.edoGin = '';
                for (let e = 0; e < resL.length; e++) {
                    data.edoGin += String(resL[e].Nombre) + ';';
                    if (e > 4) break;
                }
                edoSet(String(resL[0].Nombre).split(',')[1]);

                asign();
            } else {
                query(`SELECT Nombre, LADA FROM lada WHERE LADA LIKE '${lada.slice(0, 2)}%';`, function(resL) {
                    if (resL) { if (resL.length > 0) {
                        data.edoGin = '';
                        for (let e = 0; e < resL.length; e++) {
                            data.edoGin += String(resL[e].Nombre) + '; ';
                            if (e > 4) break;
                        }
                        edoSet(String(resL[0].Nombre).split(',')[1]);

                        asign();
                    } else {
                        asign();
                    }}
                });
            }} else {
                data.edoGin = 'No encontrado.';

                asign();
            }
        });
    } else {
        data.edoGin = 'No encontrado.';

        asign();
    }
}

server.post('/sms', upload.any(), function(req, res) {
    var msg = req.body.msg;
    var uto = req.body.to;

    var response = new responser();
    var session = req.body.session;
    if (!session) {
        response.setMessage(response.msgTypes.sessionNotFound);
        artemisa.cLog(`       -: { sent: ${response.stringify()} }`);
        res.send(response.stringify());
        return;
    }

    if (artemisa.sessionExists(session)) {
        var toSpl = uto.split('\n');

        for (let x = 0; x < toSpl.length; x++) {
            sendSMS(cleanTel(toSpl[x]), msg);
        }

        response.setMessage('Mensajes enviados.');
        res.send(response.stringify());
    } else {
        response.setMessage(response.msgTypes.sessionNotFound);
        res.send(response.stringify());
    }
});
server.post('/encode', upload.any(), function(req, res) {
    var str = req.body.str;

    var response = new responser();
    var session = req.body.session;
    if (!session) {
        response.setMessage(response.msgTypes.sessionNotFound);
        artemisa.cLog(`       -: { sent: ${response.stringify()} }`);
        res.send(response.stringify());
        return;
    }

    if (artemisa.sessionExists(session)) {
        response.setMessage(cryp(str));
        res.send(response.stringify());
    } else {
        response.setMessage(response.msgTypes.sessionNotFound);
        res.send(response.stringify());
    }
});
server.post('/decode', upload.any(), function(req, res) {
    var str = req.body.str;

    var response = new responser();
    var session = req.body.session;
    if (!session) {
        response.setMessage(response.msgTypes.sessionNotFound);
        artemisa.cLog(`       -: { sent: ${response.stringify()} }`);
        res.send(response.stringify());
        return;
    }

    if (artemisa.sessionExists(session)) {
        response.setMessage(dcryp(str));
        res.send(response.stringify());
    } else {
        response.setMessage(response.msgTypes.sessionNotFound);
        res.send(response.stringify());
    }
});

server.post('/smsInbound', upload.any(), function(req, res) {
    var type = req.body.type;
    var to = req.body.to;
    var from = req.body.msisdn;
    var messageId = req.body.messageId;
    var messageTS = req.body['message-timestamp'];
    var timestamp = req.body.timestamp;
    var nonce = req.body.nonce;
    var text = req.body.text;

    artemisa.cLog(`!!===> SMS received from ${from} says '${text}' <===!!`)

    res.status(200).send('OK');
});
server.post('/prospect', upload.any(), function(req, res) {
    /*var nombre = req.body.nombre;
    var email = req.body.email;
    var tel = req.body.telefono;
    var notes = req.body.comentarios;
    var prod = req.body.producto;
    var ent = 1;*/

    var response = new responser();

    setTimeout(autoAsign, (600 * Math.floor(Math.random() * 10)), req.body, function() {});

    response.categorize(response.actions.Redirect, response.dataTypes.URL);
    response.data.url = `https://${req.body.origin}/gracias.html`;
    res.send(response.stringify());
});

server.post('/newClientsCSV', upload.any(), function(req, res) {
    var response = new responser();

    var proList = String(req.body.proList).split('\n');

    var exeA = function(dataTo) {
        autoAsign(dataTo, function() {}, false)
    }

    for (let x = 0; x < proList.length; x++) {
        var proSpl = proList[x].split('\t');
        artemisa.cLog('!!!!!!! ->>> proSpl.length: ' + proSpl.length + ' was ' + JSON.stringify(proSpl));
        if (proSpl.length < 6) continue;
            var proData = {
                producto: proSpl[0],
                origin: proSpl[1],
                nombre: proSpl[2],
                email: proSpl[3],
                telefono: cleanTel(proSpl[4], false),
                comentarios: proSpl[5],
                session: req.body.session
            }

            setTimeout(exeA, (600 * x), proData);
    }

    response.setMessage('Procesado correctamente.')
    res.send(response.stringify());
});

server.post('/armail', upload.any(), function(req, res) {
    var msg = req.body.htext;
    var uto = req.body.user;
    var tit = req.body.title;

    var response = new responser();
    var session = req.body.session;
    if (!session) {
        response.setMessage(response.msgTypes.sessionNotFound);
        artemisa.cLog(`       -: { sent: ${response.stringify()} }`);
        res.send(response.stringify());
        return;
    }

    if (artemisa.sessionExists(session)) {
        if (!uto.includes('@')) {
            query(`SELECT Usr, Correo FROM usuarios WHERE Usr = '${uto}';`, function(resQ) {
                if (resQ.length == 0) {
                    response.setMessage('No encontramos al usuario!');
                    res.send(response.stringify());
                    return;
                }
                uto = secureParse(resQ[0].Correo)[0];
                mail({}, uto, tit, msg, function(rese) {
                    if (rese) {
                        response.setMessage('Enviado');
                        res.send(response.stringify());
                    } else {
                        response.setMessage('Ocurrió un error al enviar el correo');
                        res.send(response.stringify());
                    }
                });
            })
        } else {
            mail({}, uto, tit, msg, function(rese) {
                if (rese) {
                    response.setMessage('Enviado');
                    res.send(response.stringify());
                } else {
                    response.setMessage('Ocurrió un error al enviar el correo');
                    res.send(response.stringify());
                }
            });
        }
    } else {
        response.setMessage(response.msgTypes.sessionNotFound);
        res.send(response.stringify());
    }
});

/**
 * Inserts or modifies a new row to the selected database table.
 *
 * 'Querifies' a list of colums and values, verifying the occurrence of previous rows before inserting.
 *
 * @param {String} table Table to apply queries.
 * @param {Array} columns Array of Columns to modify/insert.
 * @param {Array} values Array of Values to modify/insert (must have the same length as Columns).
 * @param {Number} id ID field from body.req.ID (present at edit forms).
 * @param {function} success Success callback.
 * @param {function} failed Failed query callback. Takes one argument with the status code object.
 * @param {String} where 'Where' condition to find an existing element before attempting to insert a new row to 'table'.
 * @param {Boolean} failAtRepeat 'True' if wanted to call the 'failed' callback when theres a row matching the 'where' clause and aborts the insert/modify query.
 *
 * @returns {Boolean} Returns true if success callback is called or false if failed callback is called.
 */
function querify(table, columns = [], values = [], id, success = function(status = resultStatus, data) {}, failed = function(status = resultStatus, data) {}, where = '', failAtRepeat = false) {
    var clm = columns.join(', ');
    var clvl = '';
    var vls = '';
    for (let v = 0; v < values.length; v++) {
        var pValue = undefined;
        if (values[v]) pValue = String(values[v]).replace(/'/g, "\\'");
        if (pValue != 'NULL' && pValue) {
            clvl += `${columns[v]}='${pValue}', `
            vls += `'${pValue}', `
        } else {
            clvl += `${columns[v]}=NULL, `
            vls += `NULL, `
        }
    }
    clvl = clvl.substr(0, clvl.length - 2);
    vls = vls.substr(0, vls.length - 2);

    var squery = '';

    query(`SELECT * FROM ${table} WHERE ${where};`, function(ans) {
        if (ans) {
            if (id || ans.length > 0) {
                if (!id && failAtRepeat) { failed(resultStatus.row_found, ans); return false;}
                if (!id) id = ans.ID;
                squery = `UPDATE ${table} SET
                ${clvl}
                WHERE ID='${id}';`;
            } else {
                squery = `INSERT INTO ${table} (
                    ${clm}
                    ) VALUES (
                    ${vls}
                    );`;
            }
            query(squery, function(ins) {
                if (ins) {
                    if (squery.includes('INSERT')) {
                        success(resultStatus.inserted, ins); return true;
                    } else {
                        ins.ID = id;
                        success(resultStatus.modified, ins); return true;
                    }
                } else {
                    failed(resultStatus.query_failed, ins); return false;
                }
            })
        } else {
            failed(resultStatus.query_failed, ans); return false;
        }
    })
}

// server request handling
server.use('/user',
    function(req, res) {
        var html_r = null;
        var rpath = req.path.substr(1, req.path.length);
        var session = req.query.s;
        if (!session) {
            html_r = `<p class="box">
                                Sesión inválida. <a class="ar" href='../'>Regresar</p>
                            </p>`
            res.send(html_h + html_r + html_f);
            artemisa.cLog('       -: { invalid session }');
            return;
        }
        artemisa.cLog(`   -> { request: '${rpath}' }`)

        if (artemisa.sessionExists(session)) {
            var a = artemisa.sessions[session].area;
            if (a != null) {
                switch (rpath) {
                    case '':
                        artemisa.sessions[session].nav = undefined;
                        files.readFile(`site/user.html`, 'utf-8', function(err, data) {
                            if (!err) {
                                html_r = data;
                                artemisa.cLog('       -: { set user page html }');
                            } else {
                                html_r = null;
                                artemisa.cLog('       -: { user page not found }');
                            }
                            res.send(html_h + html_r + html_f);
                            artemisa.cLog('       -: { sent }');
                        });
                        break;

                    default:
                        artemisa.sessions[session].nav = undefined;
                        break;
                }
            } else {
                html_r = `<p class="box">
                                    Sesión inválida. <a class="ar" href='../'>Regresar</p>
                                </p>`
                res.send(html_h + html_r + html_f);
                artemisa.cLog('       -: { invalid session }');
            }
        } else {
            html_r = `<p class="box">
                        Sesión inválida. <a class="ar" href='../'>Regresar</p>
                    </p>`
            res.send(html_h + html_r + html_f);
            artemisa.cLog('       -: { invalid session }');
        }
    }
);

server.use('/',
    function (req, res, next) {
        var html_r = null;
        var rpath = req.path.substr(1, req.path.length);
        var lastPath = '/' + req.path.split('/')[req.path.split('/').length - 1]
        var session = req.query.s;
        if (session) {
            if (artemisa.sessions[session].area != 'icom') {
                res.redirect(`/user?s=${session}`)
                artemisa.cLog('       -: { redirecting to user panel }');
                return;
            }
        }
        artemisa.cLog(`   -> { request: '${rpath}' }`)

        switch (rpath) {
            case '':
                files.readFile('default/index.html', 'utf-8', function(err, data) {
                    if (!err) {
                        html_r = data;
                        artemisa.cLog('       -: { set landing page html }');
                    } else {
                        html_r = null;
                        artemisa.cLog('       -: { landing page not found }');
                    }
                    res.send(html_h + html_r + html_f);
                    artemisa.cLog('       -: { sent }');
                });
            break;

            case 'security':
                files.readFile('site/login.html', 'utf-8', function(err, data) {
                    if (!err) {
                        html_r = data;
                        artemisa.cLog('       -: { set login form to ' + rpath + ' }');
                    } else {
                        html_r = null;
                        artemisa.cLog('       -: { login form not found }');
                    }
                    res.send(html_h + html_r + html_f);
                    artemisa.cLog('       -: { sent }');
                });
            break;
            case 'icom':
                files.readFile('site/icom.html', 'utf-8', function(err, data) {
                    if (!err) {
                        html_r = data;
                        artemisa.cLog('       -: { set icom landing page }');
                    } else {
                        html_r = null;
                        artemisa.cLog('       -: { icom landing not found }');
                    }
                    res.send(html_h + html_r + html_f);
                    artemisa.cLog('       -: { sent }');
                });
            break;
            case 'support':
                files.readFile('site/support.html', 'utf-8', function(err, data) {
                    if (!err) {
                        html_r = data;
                        artemisa.cLog('       -: { set support landing page }');
                    } else {
                        html_r = null;
                        artemisa.cLog('       -: { support landing not found }');
                    }
                    res.send(html_h + html_r + html_f);
                    artemisa.cLog('       -: { sent }');
                });
            break;
            case 'register':
                files.readFile('site/register.html', 'utf-8', function(err, data) {
                    if (!err) {
                        html_r = data;
                        artemisa.cLog('       -: { set register landing page }');
                    } else {
                        html_r = null;
                        artemisa.cLog('       -: { register landing not found }');
                    }
                    res.send(html_h + html_r + html_f);
                    artemisa.cLog('       -: { sent }');
                });
            break;
            // Replacer :3
            case 'replacer':
                files.readFile('site/replacer.html', 'utf-8', function(err, data) {
                    if (!err) {
                        html_r = data;
                        artemisa.cLog('       -: { set replacer landing page }');
                    } else {
                        html_r = null;
                        artemisa.cLog('       -: { replacer landing not found }');
                    }
                    res.send(html_h + html_r + html_f);
                    artemisa.cLog('       -: { sent }');
                });
            break;
            // Javascript JSON mail-existence api
            case 'maile':
                var mail = String(req.query.mail);
                artemisa.cLog(mail);
                eExists({
                    sender: 'artemisa@medicalbuy.mx',
                    recipient: mail,
                    debug: true
                })
                    .then(function (response) {
                        artemisa.cLog(response);
                        res.send(JSON.stringify({ status: response }));
                    })
                    .catch(function (error) {
                        res.send(JSON.stringify(error));
                    });
            break;

            default:
                var loc = false;
                if (rpath.includes('.ico') || rpath.includes('.png') || rpath.includes('.jpg') || rpath.includes('.gif')
                || rpath.includes('.wav')) { loc = true;
                    if (files.existsSync(lpath + 'media' + lastPath)) {
                        res.sendFile(lpath + 'media' + lastPath);
                        artemisa.cLog('       -: { multimedia sent }');
                    } else { loc = false; }
                }
                if (rpath.includes('.css')) { loc = true;
                    if (files.existsSync(lpath + 'css' + lastPath)) {
                        res.sendFile(lpath + 'css' + lastPath);
                        artemisa.cLog('       -: { css sent }');
                    } else { loc = false; }
                }
                if (rpath.includes('.js')) { loc = true;
                    if (files.existsSync(lpath + 'js' + lastPath)) {
                        res.sendFile(lpath + 'js' + lastPath);
                        artemisa.cLog('       -: { js sent }');
                    } else { loc = false; }
                }
                if (rpath.includes('.pdf')) { loc = true;
                    if (files.existsSync(lpath + 'documents/gen' + lastPath)) {
                        res.sendFile(lpath + 'documents/gen' + lastPath);
                        artemisa.cLog('       -: { document sent }');
                    } else { loc = false; }
                }
                if (rpath.includes('uploads/')) { loc = true;
                    if (files.existsSync(lpath + 'uploads' + decodeURIComponent(lastPath))) {
                        res.sendFile(lpath + 'uploads' + decodeURIComponent(lastPath));
                        artemisa.cLog('       -: { uploaded file sent }');
                    } else { loc = false; }
                }
                if (files.existsSync(lpath + 'extra' + decodeURIComponent(lastPath))) { loc = true;
                    res.sendFile(lpath + 'extra' + decodeURIComponent(lastPath));
                    artemisa.cLog('       -: { extra file sent }');
                }
                if (!loc) { html_r = `<p>El recurso solicitado ('${rpath}') no existe.</p>`;
                res.status(404).send(html_h + html_r + html_f);
                artemisa.cLog('       -: { not found }'); }
            break;
        }
    }
);

// DB and Server Functions

/**
 * SQL query to the database.
 *
 * @param {String} q SQL query to request to the database.
 * @param {Function} callBack Function callback to be invoked when the result is obtained from the database. Takes one argument with the result, resolving false if the query could not be executed for an error.
 */
function query(q, callBack = function(result) {}) {
    var db = require('db');
    db.query(q, callBack);
}
/**
 * SQL query to the database, returning a dictionary instead an array of rows.
 *
 * Performs a query to the database, using the 'id' column values as keys in a dictionary-like object and
 * the second column as the value. Returns the resulting dictionary in a function callback.
 *
 * @param {String} q SQL query to request to the database.
 * @param {String} id Column name to take as the key values.
 * @param {Functio} callBack Function callback to be invoked when the result is obtained from the database. Takes one argument with the result, resolving false if the query could not be executed for an error.
 */
function queryList(q, id, callBack = function(result) {}) {
    var db = require('db');
    db.queryList(q, id, callBack);
}

function getCategory(table, cat = "Nombre", id = "ID", callBack = function(result) {}) {
    query(`SELECT ${id}, ${cat} FROM ${table};`, function(res) {
        if (res.length > 0) {
            callBack(res);
        } else {
            callBack(false);
        }
    });
}
/**
 * SQL SELECT query to table, selecting two columns, returning a dictionary instead an array of rows.
 *
 * Performs a query to the database, using the 'id' column values as keys in a dictionary-like object
 * and 'cat' column as the values. Returns the resulting dictionary in a function callback.
 *
 * @param {String} table Table to consult in database.
 * @param {String} cat Table column to take as values in dictionary.
 * @param {String} id Table column to take as keys in dictionary.
 * @param {Function} callBack Function callback to be invoked when the result is obtained from the database and parsed to a doctionary instead of an array. Takes one argument with rhe result, resolving false if the query could not be executed for an error.
 */
function getCategoryList(table, cat = "Nombre", id = "ID", callBack = function(result) {}) {
    query(`SELECT ${id}, ${cat} FROM ${table};`, function(res) {
        if (res.length > 0) {
            var ret = {};
            for (var i = 0; i < res.length; i++) {
                var el = res[i];
                ret[el[id]] = el[cat];
            }
            callBack(ret);
        } else {
            callBack(false);
        }
    });
}

// User Content Functions
function getHome(from, resultCallBack = function(homeHTML) {}) {
    if (artemisa.sessionExists(from)) {
        if (files.existsSync(`site/${artemisa.sessions[from].area}.js`)) {
            var home = reload(lpath + `site/${artemisa.sessions[from].area}.js`);
            artemisa.sessions[from].nav = home;
            home.Home(function(ret) {
                resultCallBack(ret);
            }, null, artemisa.sessions[from].user_info.ID);
        } else {
            return '';
        }
    } else {
        return  '';
    }
}
function getNav(from, area) {
    if (artemisa.sessionExists(from)) {
        if (files.existsSync(`site/${area}.js`)) {
            var nav = reload(lpath + `site/${area}.js`);
            artemisa.sessions[from].nav = nav;
            return nav;
        } else {
            return undefined;
        }
    } else {
        return  undefined;
    }
}
function getNav_(area) {
    if (files.existsSync(`site/${area}.js`)) {
        var nav = reload(lpath + `site/${area}.js`);
        return nav;
    } else {
        return undefined;
    }
}
/**
 * Process HTML templates.
 *
 * Creates a final HTML string, containing the original HTML template code
 * replacing '{object_key}', attributes found at 'data' object.
 *
 * @param {String} thead HTML template header.
 * @param {String} html HTML template content.
 * @param {String} tfoot HTML template footer.
 * @param {Object} data Data object to replace template values ('{object_key}') in 'html'.
 */
function htmlTemplate(thead, html, tfoot, data) {
    var dataf = thead + html + tfoot;
    var fl = dataf.split('\n');
    for (let x = 0; x < fl.length; x++) {
        if (fl[x].includes('{') && fl[x].includes('}')) {
            var y = 0;
            var cmda = [];
            var posS = fl[x].indexOf('{', y);
            var posE = fl[x].indexOf('}', posS + 1);
            while (posS > -1 && posE > -1) {
                cmda.push((fl[x].substring(posS + 1, posE)));
                y = posS + 1; posS = fl[x].indexOf('{', y);
                if (posS > -1) posE = fl[x].indexOf('}', posS + 1);
                artemisa.cLog(`${posS}, ${posE}`);
            }

            if (cmda.length > 0) {
                for (let a = 0; a < cmda.length; a++) {
                    var cmdo = cmda[a];
                    if (cmdo != undefined) {
                        var cmd = cmdo.split('.');
                        var datao = data[cmd[0]];

                        artemisa.cLog('    -> before parse: ' + datao);
                        datac = secureParse(datao)
                        if (datac) {
                            if (Array.isArray(datac) || datac.constructor === Object) {
                                artemisa.cLog('    -> parsed: ' + datac.constructor);
                                datao = datac;
                            }
                        }

                        if (datao != undefined) {
                            var rep = '';
                            if (!Array.isArray(datao)) {
                                rep = String(datao);
                                if (cmd.length > 1) {
                                    switch (cmd[1]) {
                                        // variable manipulation options
                                        case 'lower':
                                            rep = rep.toLowerCase();
                                        break;
                                        case 'upper':
                                            rep = rep.toUpperCase();
                                        break;
                                        case 'trimmed':
                                            rep = rep.trim();
                                        break;
                                        case 'triml':
                                            rep = rep.trimLeft();
                                        break;
                                        case 'trimr':
                                            rep = rep.trimRight();
                                        break;
                                    }
                                }
                            } else {
                                if (cmd.length > 1) {
                                    switch (cmd[1]) {
                                        case 'td':
                                            for (let c = 0; c < datao.length; c++) {
                                                rep += `<td>${datao[c]}</td>`;
                                            }
                                        break;
                                        case 'tr':
                                            for (let c = 0; c < datao.length; c++) {
                                                rep += `<tr><td>${datao[c]}</td></tr>`;
                                            }
                                        break;
                                        case 'table':
                                            rep = tableHtmlize(datao);
                                            artemisa.cLog('htmlized');
                                            break;
                                        default:
                                            rep = datao.join(cmd[1]);
                                        break;
                                    }
                                } else {
                                    rep = datao.join('\n');
                                }
                            }
                            fl[x] = fl[x].replace(`{${cmdo}}`, rep);
                            artemisa.cLog(rep);
                            artemisa.cLog(fl[x]);
                        }
                    } else {
                        continue;
                    }
                }
            }
        }
    }
    return fl.join('\n');
}
/**
 *
 * @param {String} document Document template, found at 'documents/' file inside Artemisa's folder.
 * @param {Object} data HTML Template data object, commonly generated by 'documentObject' function.
 * @param {String} fname File name for document output.
 * @param {Function} callBack Function callback, called when document generation is done. Takes one argument with the final document url, returns false if document could not be generated.
 * @param {String} header_footerOrigin Header and footer document prefix (default '').
 * @param {String} header_height Header height in milimeters (default '55mm').
 * @param {String} footer_height Footer height in milimeters (default '22mm').
 */
function docuGen(document, data, fname, callBack = function(docuURL) {}, header_footerOrigin = '', header_height = '55mm', footer_height = '22mm') {
    var tpath = lpath + 'documents/' + document + '.html';
    var thead = files.readFileSync(lpath + 'documents/' + header_footerOrigin + 'header.html');
    var tfoot = files.readFileSync(lpath + 'documents/' + header_footerOrigin + 'footer.html');
    if (files.existsSync(tpath)) {
        files.readFile(tpath, {encoding: 'utf-8'}, function(err, datab) {
            var fhtml = htmlTemplate(thead, datab, tfoot, data);
            var op = {
                format: 'Letter',
                header: {
                    height: header_height
                },
                footer: {
                    height: footer_height
                }
            };
            pdf.create(fhtml, op).toBuffer(function(err, res) {
                if (err) {
                    artemisa.cLog(`     ->! HTML-PDF ERROR: ${JSON.stringify(err)}`);
                    callBack( false );
                } else {
                    files.writeFile(lpath + 'documents/gen/' + fname + '.pdf', res, function (err2) {
                        if (err2) {
                            artemisa.cLog(`     ->! FILE ERROR: ${JSON.stringify(err2)}`);
                            callBack( false );
                        } else {
                            callBack( fname + '.pdf' );
                        }
                    });
                }
            })
        });
    } else {
        callBack( false );
    }
}
function tableHtmlize(obj = {}, tableClass = '') {
    var ret = `<table class="${tableClass}"><tr class="header">`;
    if (Array.isArray(obj)) {
        if (obj[0].constructor === Object) {
            var heads = Object.keys(obj[0]);
            for (let x = 0; x < heads.length; x++) {
                const key = heads[x];
                ret += `<td>${key}</td>`
            }
            ret += '</tr>';
            for (let index = 0; index < obj.length; index++) {
                ret += '<tr class="result">';
                const element = obj[index];
                var e_keys = Object.keys(element);
                for (let y = 0; y < e_keys.length; y++) {
                    const td = element[e_keys[y]];
                    var tde = td;
                    ret += `<td>${tde}</td>`;
                }
                ret += '</tr>';
            }
            ret += '</table>'
        } else {
            for (let index = 0; index < obj.length; index++) {
                const element = obj[index];
                if (Array.isArray(element)) {
                    if (index > 0) {
                        ret += '<tr class="result">'
                    }
                    for (let y = 0; y < element.length; y++) {
                        var tde = element[y];
                        ret += `<td>${tde}</td>`;
                    }
                    ret += '</tr>';
                } else {
                    var tde = element;
                    ret += `<td>${tde}</td>`;
                    ret += '</tr>';
                }
            }
            ret += '</table>'
        }
    } else {
        var heads = Object.keys(obj);
        var td_tmp = '';
        for (let x = 0; x < heads.length; x++) {
            const key = heads[x];
            var tde = obj[key];
            ret += `<th>${key}</th>`
            td_tmp += `<td>${tde}</td>`
        }
        ret += '</tr><tr class="result">' + td_tmp + '</tr></table>'
    }
    return ret;
}

function getUserFullName(usr, ent, result) {
    query(`select ID, Nombre, Correo, Empresas from usuarios where Usr = '${usr}' or Nombre like '%${usr}%';`, function(res) {
        if (res) { if (res.length > 0) {
            try {
                var ret = {
                    name: secureParse(res[0].Nombre)[ent],
                    mail: secureParse(res[0].Correo)[ent]
                }
                result(ret);
            } catch (error) {
                result(false);
            }
        } else {
            result(false);
        }} else {
            result(false);
        }
    });
}
function cleanTel(tel, addPrefix = true) {
    if (!tel) return '';
    if (tel == '') return '';
    if (!String(tel).match(/[0-9]/g)) return '';

    var ret = (addPrefix ? String(consultConfiguration('sms', 'defaultSMSNumberPrefix')) : '') + String(String(tel).match(/[0-9]/g).join('')).replace(/^01|^044|^045|^521|^5201|^52/g, '');

    return ret;
}

function consultConfiguration(file, section, subsection) {
    var ret = secureParse(String(file) + '.json');

    if (ret) {
        if (ret[section] && !subsection) {
            return ret[section];
        } else if(ret[section] && subsection) {
            if (ret[section][subsection]) {
                return ret[section][subsection];
            } else {
                return ret[section]['default'];
            }
        } else {
            return ret['default'];
        }
    } else {
        return undefined;
    }
}
