//requiring path and fs modules
var oracledb = require("oracledb");
const path = require("path");
const cron = require("node-cron");
const glob = require("glob"),
  options = {
    cwd: "//mnt/EOD92/",
  };
const fs = require("fs");
const { promises: test } = require("fs");
//const { start } = require('repl');
//const { time } = require('console');
//joining path of directory
//const directoryPath = path.join('D:', '/TOKO/EOD');

const directoryPath = path.join("//mnt/EOD93/");

let connection;

(async function () {
  try {
    //oracledb.initOracleClient({libDir: 'C:\\oracle\\instantclient_21_6'});
    oracledb.initOracleClient({
      configDir: "/opt/oracle/instantclient_21_6/",
    });
    connection = await oracledb.getConnection({
      user: "SAT_EDP",
      password: "SAT_EDP",
      connectString:
        "(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=10.234.144.210)(PORT=1521))(CONNECT_DATA=(SERVER=DEDICATED)(SERVICE_NAME=SATJBR)))",
    });
    console.log("Successfully connected to Oracle!");
    cron.schedule(`*/2 0-8,18-23 * * *`, async function () {
      //function which insert result into table
      async function insertIntoTable(
        date_create,
        file,
        fixed_file_size,
        Keterangan
      ) {
        await connection.execute("DELETE FROM file_eod where date_EOD = :1", [
          date_create,
        ]);

        const query = "INSERT INTO file_eod_93 VALUES (:1, :2, :3, :4)";
        binds = [date_create, file, fixed_file_size, Keterangan];
        await connection.execute(query, binds, { autoCommit: true });
      }

      async function insertLog(date_create, Log) {
        const query = "INSERT INTO log_file_eod VALUES (:1, :2)";
        binds = [date_create, Log];
        await connection.execute(query, binds, { autoCommit: true });
      }

      // Do whatever you want in here. Send email, Make  database backup or download data.

      cron.schedule(`*/2 0-8,18-23 * * *`, async function () {
        let date_ob = new Date();
        //getting date
        let date = ("0" + date_ob.getDate()).slice(-2);

        // current month
        let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);

        let year = date_ob.getFullYear();

        let longMonth = date_ob.toLocaleString("en-us", { month: "long" });

        let date_create = date - 1 + longMonth + year;

        let minutes = date_ob.getMinutes();
        let hour = date_ob.getHours();
        let jam = hour + ":" + minutes;

        let EOD;

        if (date_ob.getDate() == 1 || (hour >= 0 && hour <= 15)) {
          console.log("EOD Kemaren");
          date_create = date_ob.setDate(date_ob.getDate() - 1);
          let LastDate = ("0" + date_ob.getDate()).slice(-2);
          let LastMonth = ("0" + (date_ob.getMonth() + 1)).slice(-2);
          EOD = LastDate + LastMonth;
        } else {
          console.log("EOD Hari ini");
          EOD = date + month;
          date_create = date_ob.setDate(date_ob.getDate());
        }
        let tanggal = date_ob.toLocaleDateString();

        let tgl =
          date_ob.getDate() +
          date_ob.toLocaleString("en-us", { month: "long" }) +
          date_ob.getFullYear();

        console.log("EOD : " + EOD);
        console.log("Date Create : " + tanggal);
        console.log("Date Create : " + tgl);

        fs.readdir(directoryPath, function (err, files) {
          //handling error
          if (err) {
            return console.log("Unable to scan directory: " + err);
          } else {
            glob(
              "*(*" + EOD + ".lzh|*" + EOD + ".LZH)",
              options,
              (err, files) => {
                if (err) {
                  console.log(err);
                } else {
                  files.forEach(function (file) {
                    var fileSize = fs.statSync(directoryPath + "/" + file);
                    var fileSizeInBytes = fileSize["size"];
                    var fileSizeInKilobytes = fileSizeInBytes / 1000.0;
                    if (fileSizeInKilobytes < 400) {
                      var Keterangan = "Tidak Sempurna";
                    } else if (fileSizeInKilobytes > 1500) {
                      var Keterangan = "Tidak Wajar";
                    } else {
                      var Keterangan = "Sempurna";
                    }
                    var fixed_file_size =
                      Number(fileSizeInKilobytes.toFixed(1)) + " KB";

                    //console.log(file+ " " +fixed_file_size+" " + Keterangan);
                    insertIntoTable(tgl, file, fixed_file_size, Keterangan);
                  });
                  let log =
                    files.length +
                    " File(s) Inserted at  " +
                    new Date().toLocaleString();
                  console.log(
                    files.length +
                      " File(s) Inserted at  " +
                      new Date().toLocaleString()
                  );

                  //insertLog(date_create, log);

                  console.log(
                    "======================================================"
                  );
                }
              }
            );
          }
        });
      });
    });
  } catch (err) {
    console.log("Error: ", err);
  }
})();

//job.start()
