
var baseUrl = 'https://rest.ehrscape.com/rest/v1';
var queryUrl = baseUrl + '/query';

var username = "ois.seminar";
var password = "ois4fri";

var podatki = [["Lojzka","Novak","1925-09-30T00:40"],["Jure","Tekač","1990-1-10T06:00"],["Teta","Pehta","1950-10-05T02:10"]];

function getSessionId() {
    var response = $.ajax({
        type: "POST",
        url: baseUrl + "/session?username=" + encodeURIComponent(username) +
                "&password=" + encodeURIComponent(password),
        async: false
    });
    return response.responseJSON.sessionId;
}

function generirajPodatkeMaster(){
	generirajPodatke(1, generirajPodatke(2, generirajPodatke(3)));
}

function generirajPodatke(stPacienta, callback) {
	stPacienta--;
	var sessionId = getSessionId();
	
	$.ajaxSetup({headers: {"Ehr-Session": sessionId}});
	$.ajax({
	    url: baseUrl + "/ehr",
	    type: 'POST',
	    success: function (data) {
	        var ehrId = data.ehrId;
	        var partyData = {
	            firstNames: podatki[stPacienta][0],
	            lastNames: podatki[stPacienta][1],
	            dateOfBirth: podatki[stPacienta][2],
	            partyAdditionalInfo: [{key: "ehrId", value: ehrId}]
	        };
	        $.ajax({
	            url: baseUrl + "/demographics/party",
	            type: 'POST',
	            contentType: 'application/json',
	            data: JSON.stringify(partyData),
	            async: false,
	            success: function (party) {
	                if (party.action == 'CREATE') {
	                    $("#preberiPredlogoBolnika").append('<option value="'+ehrId+'">'+podatki[stPacienta][0]+' '+podatki[stPacienta][1]+'</option>');
						$("#preberiObstojeciEHR").append('<option value="'+ehrId+'">'+podatki[stPacienta][0]+' '+podatki[stPacienta][1]+'</option>');
						$("#preberiObstojeciVitalniZnak").append('<option value="'+ehrId+'">'+podatki[stPacienta][0]+' '+podatki[stPacienta][1]+'</option>');
						$("#preberiEhrIdZaVitalneZnake").append('<option value="'+ehrId+'">'+podatki[stPacienta][0]+' '+podatki[stPacienta][1]+'</option>');
						$("#preberiEhrZaGraf").append('<option value="'+ehrId+'">'+podatki[stPacienta][0]+' '+podatki[stPacienta][1]+'</option>');
	                }
	            }
	        });
        $.ajaxSetup({
	    	headers: {"Ehr-Session": sessionId}
		});
		for(var i=0; i<15; i++){
			var podatki2 = {
			    "ctx/language": "en",
			    "ctx/territory": "SI",
			    "ctx/time": "2016" +"-"+Math.floor((Math.random() * 12)+1)+"-"+Math.floor((Math.random() * 28)+1)+"T"+Math.floor((Math.random() * 24))+":"+ (Math.floor((Math.random() * 60)))+"Z",
			    "vital_signs/body_temperature/any_event/temperature|magnitude": 37.1,
    			"vital_signs/body_temperature/any_event/temperature|unit": "°C",
			    "vital_signs/blood_pressure/any_event/systolic": Math.floor((Math.random() * 30)+105),
			    "vital_signs/blood_pressure/any_event/diastolic": Math.floor((Math.random() * 30)+75),
			    "vital_signs/height_length/any_event/body_height_length": 171,
    			"vital_signs/body_weight/any_event/body_weight": 57.2
			};
			var parametriZahteve = {
			    ehrId: ehrId,
			    templateId: 'Vital Signs',
			    format: 'FLAT',
			    committer: "dr Poiskus"
			};
			$.ajax({
			    url: baseUrl + "/composition?" + $.param(parametriZahteve),
			    type: 'POST',
			    contentType: 'application/json',
			    data: JSON.stringify(podatki2),
			    async: false,
			    success: function (res) {},
			    error: function(err) {
			    }
			});
		}
		return ehrId;
	    }
	});
}

function kreirajEHRzaBolnika() {
	sessionId = getSessionId();
	
	var ime = $("#kreirajIme").val();
	var priimek = $("#kreirajPriimek").val();
	var datumRojstva = $("#kreirajDatumRojstva").val();

	if (!ime || !priimek || !datumRojstva || ime.trim().length == 0 ||
      priimek.trim().length == 0 || datumRojstva.trim().length == 0) {
		$("#kreirajSporocilo").html("<span class='obvestilo label " +
      "label-warning fade-in'>Prosim vnesite zahtevane podatke!</span>");
	} else {
		$.ajaxSetup({
		    headers: {"Ehr-Session": sessionId}
		});
		$.ajax({
		    url: baseUrl + "/ehr",
		    type: 'POST',
		    success: function (data) {
		        var ehrId = data.ehrId;
		        var partyData = {
		            firstNames: ime,
		            lastNames: priimek,
		            dateOfBirth: datumRojstva,
		            partyAdditionalInfo: [{key: "ehrId", value: ehrId}]
		        };
		        $.ajax({
		            url: baseUrl + "/demographics/party",
		            type: 'POST',
		            contentType: 'application/json',
		            data: JSON.stringify(partyData),
		            success: function (party) {
		                if (party.action == 'CREATE') {
		                    $("#kreirajSporocilo").html("<span class='obvestilo " +
                          "label label-success fade-in'>Uspešno kreiran EHR '" +
                          ehrId + "'.</span>");
		                    $("#preberiEHRid").val(ehrId);
		                }
		            },
		            error: function(err) {
		            	$("#kreirajSporocilo").html("<span class='obvestilo label " +
                    "label-danger fade-in'>Napaka '" +
                    JSON.parse(err.responseText).userMessage + "'!");
		            }
		        });
		    }
		});
	}
}

function preberiEHRodBolnika() {
	sessionId = getSessionId();

	var ehrId = $("#preberiEHRid").val();

	if (!ehrId || ehrId.trim().length == 0) {
		$("#preberiSporocilo").html("<span class='obvestilo label label-warning " +
      "fade-in'>Prosim vnesite zahtevan podatek!");
	} else {
		$.ajax({
			url: baseUrl + "/demographics/ehr/" + ehrId + "/party",
			type: 'GET',
			headers: {"Ehr-Session": sessionId},
	    	success: function (data) {
				var party = data.party;
				$("#preberiSporocilo").html("<span class='obvestilo label label-success fade-in'>Bolnik '" + party.firstNames + " " +party.lastNames + "', ki se je rodil '" + party.dateOfBirth +
          "'.</span>");
			},
			error: function(err) {
				$("#preberiSporocilo").html("<span class='obvestilo label " +
          "label-danger fade-in'>Napaka '" +
          JSON.parse(err.responseText).userMessage + "'!");
			}
		});
	}
}

function dodajMeritveVitalnihZnakov() {
	var sessionId = getSessionId();
	var ehrId = $("#dodajVitalnoEHR").val();
	var datumInUra = $("#dodajVitalnoDatumInUra").val();
	var sistolicniKrvniTlak = $("#dodajVitalnoKrvniTlakSistolicni").val();
	var diastolicniKrvniTlak = $("#dodajVitalnoKrvniTlakDiastolicni").val();
	var merilec = $("#dodajVitalnoMerilec").val();

	if (!ehrId || ehrId.trim().length == 0) {
	} else {
		$.ajaxSetup({headers: {"Ehr-Session": sessionId}});
		var podatki = {
			// Struktura predloge je na voljo na naslednjem spletnem naslovu:
			// https://rest.ehrscape.com/rest/v1/template/Vital%20Signs/example
			"ctx/language": "en",
			"ctx/territory": "SI",
			"ctx/time": datumInUra,
			"vital_signs/body_temperature/any_event/temperature|unit": "°C",
			"vital_signs/blood_pressure/any_event/systolic": sistolicniKrvniTlak,
			"vital_signs/blood_pressure/any_event/diastolic": diastolicniKrvniTlak,
		};
		var parametriZahteve = {
			ehrId: ehrId,
			templateId: 'Vital Signs',
			format: 'FLAT',
			committer: merilec
		};
		$.ajax({
			url: baseUrl + "/composition?" + $.param(parametriZahteve),
			type: 'POST',
			contentType: 'application/json',
			data: JSON.stringify(podatki),
			success: function (res) {},
		    error: function(err) {}
		 });
		var sumSys=0;
		var sumDia=0;
		$.ajax({
			url: baseUrl + "/demographics/ehr/" + ehrId + "/party",
			type: 'GET',
			headers: {"Ehr-Session": sessionId},
			success: function (data) {
				var party = data.party;
	    		$.ajax({
				    url: baseUrl + "/view/" + ehrId + "/" + "blood_pressure",
				    type: 'GET',
				    headers: {"Ehr-Session": sessionId},
				    success: function (res) {
				    	if (res.length > 0) {
					    	for(var i in res){
					    		if(res[i].systolic && res[i].diastolic){
						    		sumSys+=res[i].systolic;
						    		sumDia+=res[i].diastolic;
						    	}
					    	}
					    	sumSys= sumSys/res.length;
					    	sumDia= sumSys/res.length;
					    	if(Math.abs(sumSys-sistolicniKrvniTlak)>25 || Math.abs(sumDia-diastolicniKrvniTlak)){
								prikaziMap();
								setTimeout(prikaziZemljevid(), 500);
							}
						} else {}
				    },
				    error: function() {}
				});
			},
			error: function() {}
		});
	}
}

function preberiMeritveVitalnihZnakov() {
	var sessionId = getSessionId();
	
	var ehrId = $("#meritveVitalnihZnakovEHRid").val();
	var tip = $("#preberiTipZaVitalneZnake").val();
	var mesecID = $("#preberiMesec").val();
	var leto = $("#preberiLeto").val();
	if (!ehrId || ehrId.trim().length == 0 || !tip || tip.trim().length == 0) {
		$("#preberiMeritveVitalnihZnakovSporocilo").html("<span class='obvestilo " +
      "label label-warning fade-in'>Prosim vnesite zahtevan podatek!");
	} else {
		$.ajax({
			url: baseUrl + "/demographics/ehr/" + ehrId + "/party",
	    	type: 'GET',
	    	headers: {"Ehr-Session": sessionId},
	    	success: function (data) {
				var party = data.party;
				$("#rezultatMeritveVitalnihZnakov").html("<br/><span>Pridobivanje " +
        		"podatkov za <b>'" + tip + "'</b> bolnika <b>'" + party.firstNames +
        		" " + party.lastNames + "'</b>.</span><br/><br/>");
				if (tip == "krvni tlak") {
					$.ajax({
					    url: baseUrl + "/view/" + ehrId + "/" + "blood_pressure",
					    type: 'GET',
					    headers: {"Ehr-Session": sessionId},
					    success: function (res) {
					    	if (res.length > 0) {
						    	var results = "<table class='table table-striped " +
                    			"table-hover'><tr><th>Datum in ura</th>" +
                    			"<th class='text-right'>Krvni tlak</th></tr>";
						        console.log(res.length);
						        for (var i in res) {
						            results += "<tr><td>" + res[i].time +
                        			"</td><td class='text-right'>" + res[i].systolic + '/' + res[i].diastolic + " " 	+
                        			res[i].unit + "</td>";
						        }
						        results += "</table>";
						        $("#rezultatMeritveVitalnihZnakov").append(results);
					    	} else {
					    		$("#preberiMeritveVitalnihZnakovSporocilo").html(
                    				"<span class='obvestilo label label-warning fade-in'>" +
                    				"Ni podatkov!</span>");
					    	}
					    },
					    error: function() {
					    	$("#preberiMeritveVitalnihZnakovSporocilo").html(
                				"<span class='obvestilo label label-danger fade-in'>Napaka '" +
                				JSON.parse(err.responseText).userMessage + "'!");
					    }
					});
				} else if (tip=="krvni tlak filter") {
					$.ajax({
					    url: baseUrl + "/view/" + ehrId + "/" + "blood_pressure",
					    type: 'GET',
					    headers: {"Ehr-Session": sessionId},
					    success: function (res) {
					    	if (res.length > 0) {
						    	var results = "<table class='table table-striped " +
                    			"table-hover'><tr><th>Datum in ura</th>" +
                    			"<th class='text-right'>Krvni tlak</th></tr>";
						        for (var i in res) {
							         var mesec = 0;
							         mesec += parseInt(res[i].time.toString().substring(5, 6));
							         mesec += parseInt(res[i].time.toString().substring(6, 7));
							         if(parseInt(res[i].time.toString().substring(0, 4))==leto && mesec==mesecID){
							            results += "<tr><td>" + res[i].time +
	                        			"</td><td class='text-right'>" + res[i].systolic + '/' + res[i].diastolic + " " 	+
	                        			res[i].unit + "</td>";
							         }
						        }
						        results += "</table>";
						        $("#rezultatMeritveVitalnihZnakov").append(results);
					    	} else {
					    		$("#preberiMeritveVitalnihZnakovSporocilo").html(
                    				"<span class='obvestilo label label-warning fade-in'>" +
                    				"Ni podatkov!</span>");
					    	}
					    },
					    error: function() {
					    	$("#preberiMeritveVitalnihZnakovSporocilo").html(
                				"<span class='obvestilo label label-danger fade-in'>Napaka '" +
                				JSON.parse(err.responseText).userMessage + "'!");
					    }
					});
				}
	    	},
	    	error: function(err) {
	    		$("#preberiMeritveVitalnihZnakovSporocilo").html(
            "<span class='obvestilo label label-danger fade-in'>Napaka '" +
            JSON.parse(err.responseText).userMessage + "'!");
	    	}
		});
	}
}

$(document).ready(function() {
	
  /**
   * Napolni testne vrednosti (ime, priimek in datum rojstva) pri kreiranju
   * EHR zapisa za novega bolnika, ko uporabnik izbere vrednost iz
   * padajočega menuja (npr. Pujsa Pepa).
   */
  $('#preberiPredlogoBolnika').change(function() {
    $("#kreirajSporocilo").html("");
    var podatki = $(this).val().split(",");
    $("#kreirajIme").val(podatki[0]);
    $("#kreirajPriimek").val(podatki[1]);
    $("#kreirajDatumRojstva").val(podatki[2]);
  });

  /**
   * Napolni testni EHR ID pri prebiranju EHR zapisa obstoječega bolnika,
   * ko uporabnik izbere vrednost iz padajočega menuja
   * (npr. Dejan Lavbič, Pujsa Pepa, Ata Smrk)
   */
	$('#preberiObstojeciEHR').change(function() {
		$("#preberiSporocilo").html("");
		$("#preberiEHRid").val($(this).val());
	});

  /**
   * Napolni testne vrednosti (EHR ID, datum in ura, telesna višina,
   * telesna teža, telesna temperatura, sistolični in diastolični krvni tlak,
   * nasičenost krvi s kisikom in merilec) pri vnosu meritve vitalnih znakov
   * bolnika, ko uporabnik izbere vrednosti iz padajočega menuja (npr. Ata Smrk)
   */
	$('#preberiObstojeciVitalniZnak').change(function() {
		$("#dodajMeritveVitalnihZnakovSporocilo").html("");
		var podatki = $(this).val().split("|");
		$("#dodajVitalnoEHR").val(podatki[0]);
		$("#dodajVitalnoDatumInUra").val(podatki[1]);
		$("#dodajVitalnoKrvniTlakSistolicni").val(podatki[2]);
		$("#dodajVitalnoKrvniTlakDiastolicni").val(podatki[3]);
		$("#dodajVitalnoNasicenostKrviSKisikom").val(podatki[4]);
		$("#dodajVitalnoMerilec").val(podatki[5]);
	});

  /**
   * Napolni testni EHR ID pri pregledu meritev vitalnih znakov obstoječega
   * bolnika, ko uporabnik izbere vrednost iz padajočega menuja
   * (npr. Ata Smrk, Pujsa Pepa)
   */
	$('#preberiEhrIdZaVitalneZnake').change(function() {
		$("#preberiMeritveVitalnihZnakovSporocilo").html("");
		$("#rezultatMeritveVitalnihZnakov").html("");
		$("#meritveVitalnihZnakovEHRid").val($(this).val());
	});
	
	$('#preberiEhrZaGraf').change(function() {
		$("#meritveVitalnihZnakovEHRid2").val($(this).val());
	});
	google.charts.load('current', {'packages':['corechart']});
});

function prikaziZemljevid(){
	
	$("#map").html('<iframe  width="100%"  height="800"  frameborder="0"style="border:0" src="https://www.google.com/maps/embed/v1/place?key=AIzaSyBKzmlx9WJD76gmhoY3ooBUoev0cchKoWM&q=ambulance" allowfullscreen></iframe>');

}

function prikaziMap(){
	
	$("#prva").append(
		'<div class="col-lg-6 col-md-6 col-sm-6" id="zmazek">'+
			'<div class="panel panel-default">'+
				'<div class="panel-heading">'+
					'<div class="row">'+
						'<div class="col-lg-6 col-md-6 col-sm-6"><b>Lokacija najbližje pomoči</b></div>'+
					'</div>'+
				'</div>'+
				'<div class="panel-body">'+
					'<div id="map"></div>'+
				'</div>'+
			'</div>'+
		'</div>');
	$("map").focus();
}

function prikaziGraf() {
	var sessionId = getSessionId();
	var ehrId = $("#meritveVitalnihZnakovEHRid2").val();
    
	$.ajax({
		url: baseUrl + "/demographics/ehr/" + ehrId + "/party",
		type: 'GET',
		headers: {"Ehr-Session": sessionId},
		success: function (data) {
			$.ajax({
				url: baseUrl + "/view/" + ehrId + "/blood_pressure",
				type: 'GET',
				headers: {"Ehr-Session": sessionId},
				async: false, 
				success: function (res) {
					if (res.length > 0) {
						google.charts.setOnLoadCallback(drawChart);
					    function drawChart() {
					        var data = new google.visualization.DataTable();
					    	data.addColumn("string",'Čas');
					        data.addColumn('number','Systolic');
					        data.addColumn('number','Diastolic');
					        res.reverse();
						    for (var i in res){
								if(res[i].time && res[i].systolic && res[i].diastolic){
									data.addRow([res[i].time.toString().substring(0,10), parseFloat($.trim(res[i].systolic)), parseFloat($.trim(res[i].diastolic))]);
								}
							}
							var options = {title: 'Krvni pritisk', curveType: 'function', legend: { position: 'bottom' },axes: {x: {0: {side: 'top'}}}};
							var chart = new google.visualization.LineChart(document.getElementById('Graf'));
							chart.draw(data, options);
					    }
					}
				},
				error: function() {}
			});
		}
	});
}