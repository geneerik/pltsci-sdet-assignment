// Script to get the number of code lines in the github repo
'use strict';

const https = require('https')

function countGithub(repo) {
    const options = {
      host: 'api.github.com',
      port: 443,
      method: 'GET',
      path: `/repos/${repo}/stats/contributors`,
      headers: { 'User-Agent': 'Mozilla/5.0' }
    };
	
    var buffer=null;

	const req = https.request(options, (res) => {
	  res.on('data', d => {
        //console.log(d);
        if(null===buffer){
            buffer=d;
        } else {
            buffer+=d;
        }
      });
      res.on("end",()=>{
          if(!res.complete){
              throw Error("interupted");
          }
          //console.log(buffer);
          const rawContributors = JSON.parse(buffer); // this is how you parse a string into JSON
          const contributors = Array.isArray(rawContributors)?rawContributors:[rawContributors];

          let lineCounts = null;
          try{
            lineCounts = contributors.map(
              (contributor) => {
                return contributor.weeks.reduce(
                  (lineCount, week) => {
                    return lineCount + week.a - week.d
                  }, 0
                )
              }
            );
          } catch(err){
            console.error(contributors);
            throw err;
          }

        const lines = lineCounts.reduce((lineTotal, lineCount) => lineTotal + lineCount);
        console.log(lines);
      });
	});
	req.on('error', error => {
      console.error("ffff" +error)
    });
    return req.end();
}

countGithub('geneerik/pltsci-sdet-assignment'); // or count anything you like