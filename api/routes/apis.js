const express = require("express");
const router = express.Router();
const User = require("../../models/user");
const Contact = require("../../models/contact");
const Group = require("../../models/group");
const VerifyToken = require("../../models/verifyToken");
const BirthdateSchedule = require("../../models/birthdateSchedule");
const DebtSchedule = require("../../models/debtSchedule");
const RelationSchedule = require("../../models/relationSchedule");
const mongoose = require("mongoose");
const Kavenegar = require('kavenegar');
const fetch = require("node-fetch");
const node_schedule = require('node-schedule');
var kavenegarApi = Kavenegar.KavenegarApi({
	apikey: '6369352B674A66434345645633586A70352F4674414A61347565557142424A6A6A313053456B76413030673D'
});

// CRUD for user
// Create user
router.put("/addUser", (req, res) => {
	const user = new User({
		_id: mongoose.Types.ObjectId(),
		username: req.body.username,
		password: req.body.password,
		name: req.body.name
	});

	user
		.save()
		.then(resolve => {
			console.log("ADDING USER RESOLVED ==> ", resolve);
			res.status(200).json({
				message: "user added successfully.",
				user
			});
		})
		.catch(error => {
			console.log("ADDING USER ERRORED ==> ", error);
			res.status(500).json({
				error: err
			});
		});
});

// Read user with username
router.get("/getUserWithUsername/:username", (req, res) => {
	let username = req.params.username;
	User.findOne({
		username: username
	})
		.exec()
		.then(resolve => {
			console.log(resolve);
			res.status(200).json(resolve);
		})
		.catch(err => {
			console.log(err);
			res.status(500).json({ error: err });
		});
});

// Read user with phone number
router.get("/getUserWithPhoneNumber/:phone_number", (req, res) => {
	let phone_number = req.params.phone_number;
	User.findOne({
		phone_number: phone_number
	})
		.exec()
		.then(resolve => {
			console.log(resolve);
			res.status(200).json(resolve);
		})
		.catch(err => {
			console.log(err);
			res.status(500).json({ error: err });
		});
});

// Update user
router.patch("/updateUser/:username", (req, res) => {
	let username = req.params.username;
	let successfully = true;

	User.updateOne({ username: username }, req.body)
		.exec()
		.then(resolve => {
			console.log("user resolve = ", resolve);
			if (username !== req.body.username) {
				Contact.updateMany({ username: username }, { username: req.body.username })
					.exec()
					.then(reslv => {
						console.log("contact reslv = ", reslv);
					})
					.catch(err => {
						console.log(err);
						successfully = false;
					});

				Group.updateMany({ username: username }, { username: req.body.username })
					.exec()
					.then(reslv => {
						console.log("group reslv = ", reslv);
					})
					.catch(err => {
						console.log(err);
						successfully = false;
					});

				User.findOne({
					username: req.body.username
				})
					.exec()
					.then(rs => {
						console.log('rs = ', rs);
						let phone_number = rs.phone_number;
						console.log('phone_number = ', phone_number);
						if (phone_number !== null && phone_number !== undefined) {
							// console.log("%%%% SALAM %%%%");
							BirthdateSchedule.find({ username: username })
								.exec()
								.then(reslv => {
									console.log("find BirthdateSchedule reslv = ", reslv);
									for (let i = 0; i < reslv.length; i++) {

										let schedule_name = reslv[i].name;
										let day = reslv[i].day;
										let month = reslv[i].month;
										let splited = schedule_name.split(' ');
										let contact_name = splited[1];
										console.log('contact_name = ', contact_name);
										let new_schedule_name = req.body.username + ' ' + contact_name + ' birthdate';

										let birthdateScheduleObject = node_schedule.scheduleJob(new_schedule_name, '0 0 9 ' + day + ' ' + month + ' *', function () {
											console.log('Say Happy Birthday!');
											let message = 'سامانه ماش\nامروز تولد ' + contact_name + ' هست. نمیخوای بهش تبریک بگی؟';

											kavenegarApi.Send({
												message: message,
												sender: "10008663",
												receptor: phone_number
											},
												function (response, status) {
													console.log(response);
													console.log(status);
												});
										});

										BirthdateSchedule.updateOne({ name: schedule_name }, { name: new_schedule_name, username: req.body.username, scheduleObject: birthdateScheduleObject })
											.exec()
											.then(r => {
												console.log("r = ", r);
											})
											.catch(err => {
												console.log(err);
												successfully = false;
											});

										let job = node_schedule.scheduledJobs[schedule_name];
										if (job === null || job === undefined) {
											console.log('job is null or undefined.');
										}
										else {
											job.cancel();
											// console.log('node_schedule.scheduledJobs = ', node_schedule.scheduledJobs);
											console.log('job canceled');
										}
									}
								})
								.catch(err => {
									console.log(err);
									successfully = false;
								});

							DebtSchedule.find({ username: username })
								.exec()
								.then(reslv => {
									console.log("find DebtSchedule reslv = ", reslv);
									for (let i = 0; i < reslv.length; i++) {

										let schedule_name = reslv[i].name;
										let amount = reslv[i].amount;
										let splited = schedule_name.split(' ');
										let contact_name = splited[1];
										let debt_type = splited[2];
										console.log('contact_name = ', contact_name);
										console.log('debt_type = ', debt_type);
										let new_schedule_name = req.body.username + ' ' + contact_name + ' ' + debt_type;

										let debtScheduleObject = node_schedule.scheduleJob(new_schedule_name, '0 0 9 * * 4', function () {
											console.log(debt_type, ' reminded!');
											let message;
											if (debt_type === 'debt_userToCon') {
												message = 'سامانه ماش\nیادت هست که مبلغ ' + amount + ' تومان به ' + contact_name + ' بدهکاری؟';
											}
											else {
												message = 'سامانه ماش\nیادت هست که مبلغ ' + amount + ' تومان از ' + contact_name + ' طلبکاری؟';
											}

											kavenegarApi.Send({
												message: message,
												sender: "10008663",
												receptor: phone_number
											},
												function (response, status) {
													console.log(response);
													console.log(status);
												});
										});

										DebtSchedule.updateOne({ name: schedule_name }, { name: new_schedule_name, username: req.body.username, scheduleObject: debtScheduleObject })
											.exec()
											.then(r => {
												console.log("r = ", r);
											})
											.catch(err => {
												console.log(err);
												successfully = false;
											});

										let job = node_schedule.scheduledJobs[schedule_name];
										if (job === null || job === undefined) {
											console.log('job is null or undefined.');
										}
										else {
											job.cancel();
											console.log('job canceled');
										}
									}
								})
								.catch(err => {
									console.log(err);
									successfully = false;
								});

							RelationSchedule.find({ username: username })
								.exec()
								.then(reslv => {
									console.log("find RelationSchedule reslv = ", reslv);
									for (let i = 0; i < reslv.length; i++) {

										let schedule_name = reslv[i].name;
										let duration = reslv[i].duration;
										let scheduleType = reslv[i].scheduleType;
										let splited = schedule_name.split(' ');
										let contact_name = splited[1];
										console.log('contact_name = ', contact_name);
										let new_schedule_name = req.body.username + ' ' + contact_name + ' duration_' + scheduleType;
										let minutes = duration * 24 * 60;

										let relationScheduleObject = node_schedule.scheduleJob(new_schedule_name, '0 */' + minutes + ' * * * *', function () {
											console.log(scheduleType + ' reminded!');
											let message;
											if (scheduleType === 'message') {
												message = 'سامانه ماش\nنمیخوای به ' + contact_name + ' یه پیام بدی؟';
											}
											else if (scheduleType === 'call') {
												message = 'سامانه ماش\nنمیخوای با ' + contact_name + ' یه تماس بگیری؟';
											}
											else if (scheduleType === 'meeting') {
												message = 'سامانه ماش\nنمیخوای با ' + contact_name + ' یه قرار ملاقات بذاری؟';
											}
											else {
												message = '';
											}

											kavenegarApi.Send({
												message: message,
												sender: "10008663",
												receptor: phone_number
											},
												function (response, status) {
													console.log(response);
													console.log(status);
												});
										});

										RelationSchedule.updateOne({ name: schedule_name }, { name: new_schedule_name, username: req.body.username, scheduleObject: relationScheduleObject })
											.exec()
											.then(r => {
												console.log("r = ", r);
											})
											.catch(err => {
												console.log(err);
												successfully = false;
											});

										let job = node_schedule.scheduledJobs[schedule_name];
										if (job === null || job === undefined) {
											console.log('job is null or undefined.');
										}
										else {
											job.cancel();
											// console.log('node_schedule.scheduledJobs = ', node_schedule.scheduledJobs);
											console.log('job canceled');
										}
									}
								})
								.catch(err => {
									console.log(err);
									successfully = false;
								});
						}
					})
					.catch(err => {
						console.log(err);
						successfully = false;
					});

				VerifyToken.updateOne({ username: username }, { username: req.body.username })
					.exec()
					.then(r => {
						console.log("r = ", r);
					})
					.catch(err => {
						console.log(err);
						successfully = false;
					});
			}
		})
		.catch(err => {
			console.log(err);
			successfully = false;
		});

	// console.log('node_schedule.scheduledJobs = ', node_schedule.scheduledJobs);

	if (successfully === true) {
		res.status(200).json({
			message: 'User updated successfully.',
		});
	}
	else {
		res.status(500).json({
			message: 'Error in updating the user.'
		});
	}
});

// Delete user
router.delete("/deleteUser/:username", (req, res) => {
	let username = req.params.username;
	let successfully = true;

	User.deleteOne({
		username: username
	})
		.exec()
		.then(resolve => {
			console.log(resolve);

			Contact.deleteMany({ username: username })
				.exec()
				.then(reslv => {
					console.log("delete contact reslv = ", reslv);
				})
				.catch(err => {
					console.log(err);
					successfully = false;
				});

			Group.deleteMany({ username: username })
				.exec()
				.then(reslv => {
					console.log("delete group reslv = ", reslv);
				})
				.catch(err => {
					console.log(err);
					successfully = false;
				});

			BirthdateSchedule.find({ username: username })
				.exec()
				.then(reslv => {
					console.log("find BirthdateSchedule reslv = ", reslv);
					for (let i = 0; i < reslv.length; i++) {

						let schedule_name = reslv[i].name;
						console.log('schedule_name = ', schedule_name);
						// console.log('1 node_schedule.scheduledJobs = ', node_schedule.scheduledJobs);
						let job = node_schedule.scheduledJobs[schedule_name];
						if (job === null || job === undefined) {
							console.log('job ' + schedule_name + ' is null or undefined.');
						}
						else {
							console.log('job ' + schedule_name + ' canceled');
							console.log('salam1 ', node_schedule.scheduledJobs);
							job.cancel();
						}
					}

					BirthdateSchedule.deleteMany({ username: username })
						.exec()
						.then(reslv => {
							console.log("delete birthdateSchedule reslv = ", reslv);
						})
						.catch(err => {
							console.log(err);
							successfully = false;
						});
				})
				.catch(err => {
					console.log(err);
					successfully = false;
				});

			DebtSchedule.find({ username: username })
				.exec()
				.then(reslv => {
					console.log("find DebtSchedule reslv = ", reslv);
					for (let i = 0; i < reslv.length; i++) {

						let schedule_name = reslv[i].name;
						// console.log('schedule_name = ', schedule_name);
						// console.log('node_schedule.scheduledJobs = ', node_schedule.scheduledJobs);
						let job = node_schedule.scheduledJobs[schedule_name];
						if (job === null || job === undefined) {
							console.log('job ' + schedule_name + ' is null or undefined.');
						}
						else {
							console.log('job ' + schedule_name + ' canceled');
							console.log('salam2 ', node_schedule.scheduledJobs);
							job.cancel();
						}
					}

					DebtSchedule.deleteMany({ username: username })
						.exec()
						.then(reslv => {
							console.log("delete debtSchedule reslv = ", reslv);
						})
						.catch(err => {
							console.log(err);
							successfully = false;
						});
				})
				.catch(err => {
					console.log(err);
					successfully = false;
				});

			RelationSchedule.find({ username: username })
				.exec()
				.then(reslv => {
					console.log("find RelationSchedule reslv = ", reslv);
					for (let i = 0; i < reslv.length; i++) {

						let schedule_name = reslv[i].name;
						// console.log('schedule_name = ', schedule_name);
						// console.log('node_schedule.scheduledJobs = ', node_schedule.scheduledJobs);
						let job = node_schedule.scheduledJobs[schedule_name];
						if (job === null || job === undefined) {
							console.log('job ' + schedule_name + ' is null or undefined.');
						}
						else {
							console.log('job ' + schedule_name + ' canceled');
							console.log('salam3 ', node_schedule.scheduledJobs);
							job.cancel();
						}
					}

					RelationSchedule.deleteMany({ username: username })
						.exec()
						.then(reslv => {
							console.log("delete RelationSchedule reslv = ", reslv);
						})
						.catch(err => {
							console.log(err);
							successfully = false;
						});
				})
				.catch(err => {
					console.log(err);
					successfully = false;
				});

			VerifyToken.deleteMany({ username: username })
				.exec()
				.then(reslv => {
					console.log("delete verifyToken reslv = ", reslv);
				})
				.catch(err => {
					console.log(err);
					successfully = false;
				});
		})
		.catch(err => {
			console.log(err);
			successfully = false;
		});

	if (successfully === true) {
		res.status(200).json({
			message: 'User deleted successfully.',
		});
	}
	else {
		res.status(500).json({
			message: 'Error in deleting the user.'
		});
	}
});


// CRUD for contact
// Create contact
router.put("/addContact", (req, res) => {
	let values = req.body.values;
	const contact = new Contact({
		_id: mongoose.Types.ObjectId(),
		username: req.body.username,
		name: values.name,
		birthDate: values.birthDate,
		debt_userToCon: values.debt_userToCon,
		debt_conToUser: values.debt_conToUser,
		note: values.note,
		duration_message: values.duration_message,
		duration_call: values.duration_call,
		duration_meeting: values.duration_meeting
	});

	contact
		.save()
		.then(resolve => {
			console.log("ADDING CONTACT RESOLVED ==> ", resolve);

			let phone_number;
			User.findOne({
				username: req.body.username
			})
				.exec()
				.then(resolve => {
					console.log("resolve = ", resolve);
					phone_number = resolve.phone_number;
					console.log("phone_number = ", phone_number);

					if (phone_number !== null && phone_number !== undefined) {
						if (values.birthDate !== null && values.birthDate !== undefined) {
							console.log("Handling Birthdate");
							let birthDate = values.birthDate;
							let month = Number(birthDate.substring(5, 7));
							let day = Number(birthDate.substring(8, 10));

							let birthdateScheduleObject = node_schedule.scheduleJob(req.body.username + ' ' + values.name + ' birthdate', '0 0 9 ' + day + ' ' + month + ' *', function () {
								console.log('Say Happy Birthday!');
								let message = 'سامانه ماش\nامروز تولد ' + values.name + ' هست. نمیخوای بهش تبریک بگی؟';

								kavenegarApi.Send({
									message: message,
									sender: "10008663",
									receptor: phone_number
								},
									function (response, status) {
										console.log(response);
										console.log(status);
									});
							});

							const birthdateSchedule = new BirthdateSchedule({
								_id: mongoose.Types.ObjectId(),
								name: req.body.username + ' ' + values.name + ' birthdate',
								username: req.body.username,
								contact_name: values.name,
								day: day,
								month: month,
								scheduleObject: birthdateScheduleObject
							});

							birthdateSchedule
								.save()
								.then(rslv => {
									console.log("rslv = ", rslv);
								})
								.catch(err => {
									console.log("ADDING BIRTHDATESCHEDULE ERRORED ==> ", err);
								});
						}

						if (values.debt_userToCon !== null && values.debt_userToCon !== undefined) {
							console.log("Handling debt_userToCon");
							let debt_userToCon = values.debt_userToCon;
							console.log('debt_userToCon = ', debt_userToCon);
							console.log('typeof(debt_userToCon) = ', typeof (debt_userToCon));

							let debtUserToConScheduleObject = node_schedule.scheduleJob(req.body.username + ' ' + values.name + ' debt_userToCon', '0 0 9 * * 4', function () {
								console.log('debt_userToCon reminded!');
								let message = 'سامانه ماش\nیادت هست که مبلغ ' + debt_userToCon + ' تومان به ' + values.name + ' بدهکاری؟';

								kavenegarApi.Send({
									message: message,
									sender: "10008663",
									receptor: phone_number
								},
									function (response, status) {
										console.log(response);
										console.log(status);
									});
							});

							const debtUserToConSchedule = new DebtSchedule({
								_id: mongoose.Types.ObjectId(),
								name: req.body.username + ' ' + values.name + ' debt_userToCon',
								username: req.body.username,
								contact_name: values.name,
								amount: debt_userToCon,
								scheduleType: 'debt_userToCon',
								scheduleObject: debtUserToConScheduleObject
							});

							debtUserToConSchedule
								.save()
								.then(rslv => {
									console.log("rslv = ", rslv);
								})
								.catch(err => {
									console.log("ADDING DEBTSCHEDULE ERRORED ==> ", err);
								});
						}

						if (values.debt_conToUser !== null && values.debt_conToUser !== undefined) {
							console.log("Handling debt_conToUser");
							let debt_conToUser = values.debt_conToUser;
							console.log('debt_conToUser = ', debt_conToUser);
							console.log('typeof(debt_conToUser) = ', typeof (debt_conToUser));

							let debtConToUserScheduleObject = node_schedule.scheduleJob(req.body.username + ' ' + values.name + ' debt_conToUser', '0 0 9 * * 4', function () {
								console.log('debt_conToUser reminded!');
								let message = 'سامانه ماش\nیادت هست که مبلغ ' + debt_conToUser + ' تومان از ' + values.name + ' طلبکاری؟';

								kavenegarApi.Send({
									message: message,
									sender: "10008663",
									receptor: phone_number
								},
									function (response, status) {
										console.log(response);
										console.log(status);
									});
							});

							const debtConToUserSchedule = new DebtSchedule({
								_id: mongoose.Types.ObjectId(),
								name: req.body.username + ' ' + values.name + ' debt_conToUser',
								username: req.body.username,
								contact_name: values.name,
								amount: debt_conToUser,
								scheduleType: 'debt_conToUser',
								scheduleObject: debtConToUserScheduleObject
							});

							debtConToUserSchedule
								.save()
								.then(rslv => {
									console.log("rslv = ", rslv);
								})
								.catch(err => {
									console.log("ADDING DEBTSCHEDULE ERRORED ==> ", err);
								});
						}

						if (values.duration_message !== null && values.duration_message !== undefined) {
							console.log("Handling duration_message");
							let duration_message = values.duration_message;
							console.log('duration_message = ', duration_message);
							console.log('typeof(duration_message) = ', typeof (duration_message));

							let minutes = duration_message * 24 * 60;
							let durationMessageScheduleObject = node_schedule.scheduleJob(req.body.username + ' ' + values.name + ' duration_message', '0 */' + minutes + ' * * * *', function () {
								console.log('duration_message reminded!');
								let message = 'سامانه ماش\nنمیخوای به ' + values.name + ' یه پیام بدی؟';

								kavenegarApi.Send({
									message: message,
									sender: "10008663",
									receptor: phone_number
								},
									function (response, status) {
										console.log(response);
										console.log(status);
									});
							});

							const durationMessageSchedule = new RelationSchedule({
								_id: mongoose.Types.ObjectId(),
								name: req.body.username + ' ' + values.name + ' duration_message',
								username: req.body.username,
								contact_name: values.name,
								duration: duration_message,
								scheduleType: 'message',
								scheduleObject: durationMessageScheduleObject
							});

							durationMessageSchedule
								.save()
								.then(rslv => {
									console.log("rslv = ", rslv);
								})
								.catch(err => {
									console.log("ADDING DURATIONSCHEDULE ERRORED ==> ", err);
								});
						}

						if (values.duration_call !== null && values.duration_call !== undefined) {
							console.log("Handling duration_call");
							let duration_call = values.duration_call;
							console.log('duration_call = ', duration_call);
							console.log('typeof(duration_call) = ', typeof (duration_call));

							let minutes = duration_call * 24 * 60;
							let durationCallScheduleObject = node_schedule.scheduleJob(req.body.username + ' ' + values.name + ' duration_call', '0 */' + minutes + ' * * * *', function () {
								console.log('duration_call reminded!');
								let message = 'سامانه ماش\nنمیخوای با ' + values.name + ' یه تماس بگیری؟';

								kavenegarApi.Send({
									message: message,
									sender: "10008663",
									receptor: phone_number
								},
									function (response, status) {
										console.log(response);
										console.log(status);
									});
							});

							const durationCallSchedule = new RelationSchedule({
								_id: mongoose.Types.ObjectId(),
								name: req.body.username + ' ' + values.name + ' duration_call',
								username: req.body.username,
								contact_name: values.name,
								duration: duration_call,
								scheduleType: 'call',
								scheduleObject: durationCallScheduleObject
							});

							durationCallSchedule
								.save()
								.then(rslv => {
									console.log("rslv = ", rslv);
								})
								.catch(err => {
									console.log("ADDING DURATIONSCHEDULE ERRORED ==> ", err);
								});
						}

						if (values.duration_meeting !== null && values.duration_meeting !== undefined) {
							console.log("Handling duration_meeting");
							let duration_meeting = values.duration_meeting;
							console.log('duration_meeting = ', duration_meeting);
							console.log('typeof(duration_meeting) = ', typeof (duration_meeting));

							let minutes = duration_meeting * 24 * 60;
							let durationMeetingScheduleObject = node_schedule.scheduleJob(req.body.username + ' ' + values.name + ' duration_meeting', '0 */' + minutes + ' * * * *', function () {
								console.log('duration_meeting reminded!');
								let message = 'سامانه ماش\nنمیخوای با ' + values.name + ' یه قرار ملاقات بذاری؟';

								kavenegarApi.Send({
									message: message,
									sender: "10008663",
									receptor: phone_number
								},
									function (response, status) {
										console.log(response);
										console.log(status);
									});
							});

							const durationMeetingSchedule = new RelationSchedule({
								_id: mongoose.Types.ObjectId(),
								name: req.body.username + ' ' + values.name + ' duration_meeting',
								username: req.body.username,
								contact_name: values.name,
								duration: duration_meeting,
								scheduleType: 'meeting',
								scheduleObject: durationMeetingScheduleObject
							});

							durationMeetingSchedule
								.save()
								.then(rslv => {
									console.log("rslv = ", rslv);
								})
								.catch(err => {
									console.log("ADDING DURATIONSCHEDULE ERRORED ==> ", err);
								});
						}

						console.log('5 node_schedule.scheduledJobs = ', node_schedule.scheduledJobs);
					}
				})
				.catch(err => {
					console.log(err);
				});

			res.status(200).json({
				message: "contact added successfully.",
				contact
			});
		})
		.catch(err => {
			console.log("ADDING CONTACT ERRORED ==> ", err);
			res.status(500).json({
				error: err
			});
		});
});

// Read contact
router.get("/getContact/:username/:contact_name", (req, res) => {
	let contact_name = req.params.contact_name;
	let username = req.params.username;
	Contact.findOne({
		name: contact_name,
		username: username
	})
		.exec()
		.then(resolve => {
			console.log("get resolve = ", resolve);
			res.status(200).json(resolve);
		})
		.catch(err => {
			console.log(err);
			res.status(500).json({ error: err });
		});
});

// Read contacts
router.get("/getContacts/:username", (req, res) => {
	let username = req.params.username;
	Contact.find({
		username: username
	})
		.exec()
		.then(resolve => {
			console.log(resolve);
			res.status(200).json(resolve);
		})
		.catch(err => {
			console.log(err);
			res.status(500).json({ error: err });
		});
});

// Update contact
router.patch("/updateContact/:username/:contact_name", (req, res) => {
	let username = req.params.username;
	let contact_name = req.params.contact_name;
	let successfully = true;

	console.log("username = ", username, ", contact_name = ", contact_name);
	console.log("#### ", req.body);

	let birthDate;
	let debt_userToCon;
	let debt_conToUser;
	let duration_message;
	let duration_call;
	let duration_meeting;

	let new_d;
	let new_m;
	let new_d_cTOu;
	let new_d_uTOc;
	let new_duration_message;
	let new_duration_call;
	let new_duration_meeting;

	Contact.findOne({ username: username, name: contact_name })
		.exec()
		.then(resolve => {
			console.log(resolve);
			birthDate = resolve.birthDate;
			debt_userToCon = resolve.debt_userToCon;
			debt_conToUser = resolve.debt_conToUser;
			duration_message = resolve.duration_message;
			duration_call = resolve.duration_call;
			duration_meeting = resolve.duration_meeting;

			if (req.body.birthDate !== null && req.body.birthDate !== undefined && birthDate !== null && birthDate !== undefined) {
				if (req.body.birthDate.substring(5, 7) !== birthDate.getMonth()) {
					new_m = req.body.birthDate.substring(5, 7);
					console.log("month");
				}
				else {
					new_m = birthDate.getMonth();
				}
			}
			else if (req.body.birthDate !== null && req.body.birthDate !== undefined) {
				new_m = req.body.birthDate.substring(5, 7);
			}
			else if (birthDate !== null && birthDate !== undefined) {
				new_m = birthDate.getMonth();
			}
			else {
				new_m = null;
			}

			if (req.body.birthDate !== null && req.body.birthDate !== undefined && birthDate !== null && birthDate !== undefined) {
				if (req.body.birthDate.substring(8, 10) !== birthDate.getUTCDate()) {
					new_d = req.body.birthDate.substring(8, 10);
					console.log("day");
				}
				else {
					new_d = birthDate.getUTCDate();
				}
			}
			else if (req.body.birthDate !== null && req.body.birthDate !== undefined) {
				new_d = req.body.birthDate.substring(8, 10);
			}
			else if (birthDate !== null && birthDate !== undefined) {
				new_d = birthDate.getUTCDate();
			}
			else {
				new_d = null;
			}

			if (req.body.debt_conToUser !== null && req.body.debt_conToUser !== undefined && debt_conToUser !== null && debt_conToUser !== undefined) {
				if (req.body.debt_conToUser !== debt_conToUser) {
					new_d_cTOu = req.body.debt_conToUser;
					console.log("debt_conToUser");
				}
				else {
					new_d_cTOu = debt_conToUser;
				}
			}
			else if (req.body.debt_conToUser !== null && req.body.debt_conToUser !== undefined) {
				new_d_cTOu = req.body.debt_conToUser;
			}
			else if (debt_conToUser !== null && debt_conToUser !== undefined) {
				new_d_cTOu = debt_conToUser;
			}
			else {
				new_d_cTOu = null;
			}

			if (req.body.debt_userToCon !== null && req.body.debt_userToCon !== undefined && debt_userToCon !== null && debt_userToCon !== undefined) {
				if (req.body.debt_userToCon !== debt_userToCon) {
					new_d_uTOc = req.body.debt_userToCon;
					console.log("debt_userToCon");
				}
				else {
					new_d_uTOc = debt_userToCon;
				}
			}
			else if (req.body.debt_userToCon !== null && req.body.debt_userToCon !== undefined) {
				new_d_uTOc = req.body.debt_userToCon;
			}
			else if (debt_userToCon !== null && debt_userToCon !== undefined) {
				new_d_uTOc = debt_userToCon;
			}
			else {
				new_d_uTOc = null;
			}

			if (req.body.duration_message !== null && req.body.duration_message !== undefined && duration_message !== null && duration_message !== undefined) {
				if (req.body.duration_message !== duration_message) {
					new_duration_message = req.body.duration_message;
					console.log("duration_message");
				}
				else {
					new_duration_message = duration_message;
				}
			}
			else if (req.body.duration_message !== null && req.body.duration_message !== undefined) {
				new_duration_message = req.body.duration_message;
			}
			else if (duration_message !== null && duration_message !== undefined) {
				new_duration_message = duration_message;
			}
			else {
				new_duration_message = null;
			}

			if (req.body.duration_call !== null && req.body.duration_call !== undefined && duration_call !== null && duration_call !== undefined) {
				if (req.body.duration_call !== duration_call) {
					new_duration_call = req.body.duration_call;
					console.log("duration_call");
				}
				else {
					new_duration_call = duration_call;
				}
			}
			else if (req.body.duration_call !== null && req.body.duration_call !== undefined) {
				new_duration_call = req.body.duration_call;
			}
			else if (duration_call !== null && duration_call !== undefined) {
				new_duration_call = duration_call;
			}
			else {
				new_duration_call = null;
			}

			if (req.body.duration_meeting !== null && req.body.duration_meeting !== undefined && duration_meeting !== null && duration_meeting !== undefined) {
				if (req.body.duration_meeting !== duration_meeting) {
					new_duration_meeting = req.body.duration_meeting;
					console.log("duration_meeting");
				}
				else {
					new_duration_meeting = duration_meeting;
				}
			}
			else if (req.body.duration_meeting !== null && req.body.duration_meeting !== undefined) {
				new_duration_meeting = req.body.duration_meeting;
			}
			else if (duration_meeting !== null && duration_meeting !== undefined) {
				new_duration_meeting = duration_meeting;
			}
			else {
				new_duration_meeting = null;
			}


			Contact.updateOne({ username: username, name: contact_name }, req.body)
				.exec()
				.then(resolve => {
					console.log("update resolve = ", resolve);

					if (contact_name !== req.body.name) {

						Group.find({
							username: username
						})
							.exec()
							.then(reslv => {
								reslv.map((group, index) => {
									let group_contacts = group.contacts;
									let group_name = group.name;
									if (group_contacts.includes(contact_name) === true) {
										group_contacts = group_contacts.filter(function (val, index, arr) { return val !== contact_name });
										group_contacts.push(req.body.name);
										Group.updateOne({ username: username, name: group_name }, { contacts: group_contacts })
											.exec()
											.then(r => {
												console.log(r);
											})
											.catch(err => {
												console.log(err);
												successfully = false;
											});
									}
								})
							})
							.catch(err => {
								console.log(err);
								successfully = false;
							});

						User.findOne({
							username: username
						})
							.exec()
							.then(rs => {
								console.log('rs = ', rs);
								let phone_number = rs.phone_number;
								console.log('phone_number = ', phone_number);
								if (phone_number !== null && phone_number !== undefined) {

									// console.log("%%%% SALAM %%%%");
									BirthdateSchedule.findOne({ username: username, contact_name: contact_name })
										.exec()
										.then(reslv => {
											if (reslv !== null) {
												console.log("find BirthdateSchedule reslv = ", reslv);

												let schedule_name = reslv.name;
												// let day = reslv.day;
												// let month = reslv.month;
												// let splited = schedule_name.split(' ');
												// let contact_name = splited[1];
												// console.log('contact_name = ', contact_name);
												let new_schedule_name = username + ' ' + req.body.name + ' birthdate';

												let job = node_schedule.scheduledJobs[schedule_name];
												if (job === null || job === undefined) {
													console.log('job is null or undefined.');
												}
												else {
													job.cancel();
													// console.log('node_schedule.scheduledJobs = ', node_schedule.scheduledJobs);
													console.log('job canceled');
												}

												let birthdateScheduleObject = node_schedule.scheduleJob(new_schedule_name, '0 0 9 ' + new_d + ' ' + new_m + ' *', function () {
													console.log('Say Happy Birthday!');
													let message = 'سامانه ماش\nامروز تولد ' + req.body.name + ' هست. نمیخوای بهش تبریک بگی؟';

													kavenegarApi.Send({
														message: message,
														sender: "10008663",
														receptor: phone_number
													},
														function (response, status) {
															console.log(response);
															console.log(status);
														});
												});

												BirthdateSchedule.updateOne({ name: schedule_name }, { name: new_schedule_name, contact_name: req.body.name, day: new_d, month: new_m, scheduleObject: birthdateScheduleObject })
													.exec()
													.then(r => {
														console.log("r = ", r);
													})
													.catch(err => {
														console.log(err);
														successfully = false;
													});
											}
										})
										.catch(err => {
											console.log(err);
											successfully = false;
										});


									DebtSchedule.find({ username: username, contact_name: contact_name })
										.exec()
										.then(reslv => {
											console.log("find DebtSchedule reslv = ", reslv);
											for (let i = 0; i < reslv.length; i++) {

												let schedule_name = reslv[i].name;

												let splited = schedule_name.split(' ');
												// let contact_name = splited[1];
												let debt_type = splited[2];
												let amount = (debt_type === 'debt_conToUser') ? new_d_cTOu : new_d_uTOc;
												// console.log('contact_name = ', contact_name);
												console.log('debt_type = ', debt_type);
												let new_schedule_name = username + ' ' + req.body.name + ' ' + debt_type;

												let job = node_schedule.scheduledJobs[schedule_name];
												if (job === null || job === undefined) {
													console.log('job is null or undefined.');
												}
												else {
													job.cancel();
													console.log('job canceled');
												}

												let debtScheduleObject = node_schedule.scheduleJob(new_schedule_name, '0 0 9 * * 4', function () {
													console.log(debt_type, ' reminded!');
													let message;
													if (debt_type === 'debt_userToCon') {
														message = 'سامانه ماش\nیادت هست که مبلغ ' + amount + ' تومان به ' + req.body.name + ' بدهکاری؟';
													}
													else {
														message = 'سامانه ماش\nیادت هست که مبلغ ' + amount + ' تومان از ' + req.body.name + ' طلبکاری؟';
													}

													kavenegarApi.Send({
														message: message,
														sender: "10008663",
														receptor: phone_number
													},
														function (response, status) {
															console.log(response);
															console.log(status);
														});
												});

												DebtSchedule.updateOne({ name: schedule_name }, { name: new_schedule_name, contact_name: req.body.name, amount: amount, scheduleObject: debtScheduleObject })
													.exec()
													.then(r => {
														console.log("r = ", r);
													})
													.catch(err => {
														console.log(err);
														successfully = false;
													});
											}
										})
										.catch(err => {
											console.log(err);
											successfully = false;
										});

									RelationSchedule.find({ username: username, contact_name: contact_name })
										.exec()
										.then(reslv => {
											console.log("find RelationSchedule reslv = ", reslv);
											for (let i = 0; i < reslv.length; i++) {

												let schedule_name = reslv[i].name;
												// let splited = schedule_name.split(' ');
												// let contact_name = splited[1];
												let scheduleType = reslv[i].scheduleType;
												let duration;
												if (scheduleType === 'message') {
													duration = new_duration_message;
												}
												else if (scheduleType === 'call') {
													duration = new_duration_call;
												}
												else {
													duration = new_duration_meeting;
												}
												// let duration = (scheduleType === 'message') ? new_duration_message : (scheduleType === 'call' ? new_duration_call : new_duration_meeting);
												// console.log('contact_name = ', contact_name);
												console.log('scheduleType = ', scheduleType);
												console.log('duration = ', duration);
												let new_schedule_name = username + ' ' + req.body.name + ' duration_' + scheduleType;

												let job = node_schedule.scheduledJobs[schedule_name];
												if (job === null || job === undefined) {
													console.log('job is null or undefined.');
												}
												else {
													job.cancel();
													console.log('job canceled');
												}

												let minutes = duration * 24 * 60;
												let relationScheduleObject = node_schedule.scheduleJob(new_schedule_name, '0 */' + minutes + ' * * * *', function () {
													console.log(scheduleType, ' reminded!');
													let message;
													if (scheduleType === 'message') {
														message = 'سامانه ماش\nنمیخوای به ' + req.body.name + ' یه پیام بدی؟';
													}
													else if (scheduleType === 'call') {
														message = 'سامانه ماش\nنمیخوای با ' + req.body.name + ' یه تماس بگیری؟';
													}
													else if (scheduleType === 'meeting') {
														message = 'سامانه ماش\nنمیخوای با ' + req.body.name + ' یه قرار ملاقات بذاری؟';
													}
													else {
														message = '';
													}

													kavenegarApi.Send({
														message: message,
														sender: "10008663",
														receptor: phone_number
													},
														function (response, status) {
															console.log(response);
															console.log(status);
														});
												});

												RelationSchedule.updateOne({ name: schedule_name }, { name: new_schedule_name, contact_name: req.body.name, duration: duration, scheduleObject: relationScheduleObject })
													.exec()
													.then(r => {
														console.log("r = ", r);
													})
													.catch(err => {
														console.log(err);
														successfully = false;
													});
											}
										})
										.catch(err => {
											console.log(err);
											successfully = false;
										});
								}
							})
							.catch(err => {
								console.log(err);
								successfully = false;
							});
					}
				})
				.catch(err => {
					console.log(err);
					successfully = false;
				});


			if (birthDate === undefined || birthDate === null) {
				if (req.body.birthDate !== null && req.body.birthDate !== undefined) { // new schedule

					User.findOne({
						username: username
					})
						.exec()
						.then(rs => {
							let phone_number = rs.phone_number;
							if (phone_number !== null && phone_number !== undefined) { // new schedule

								console.log("Handling Birthdate");
								let new_birthDate = req.body.birthDate;
								let new_month = Number(new_birthDate.substring(5, 7));
								let new_day = Number(new_birthDate.substring(8, 10));
								console.log('new_month = ', new_month, ', new_day = ', new_day);

								let birthdateScheduleObject = node_schedule.scheduleJob(username + ' ' + req.body.name + ' birthdate', '0 0 9 ' + new_day + ' ' + new_month + ' *', function () {
									console.log('Say Happy Birthday!');
									let message = 'سامانه ماش\nامروز تولد ' + req.body.name + ' هست. نمیخوای بهش تبریک بگی؟';

									kavenegarApi.Send({
										message: message,
										sender: "10008663",
										receptor: phone_number
									},
										function (response, status) {
											console.log(response);
											console.log(status);
										});
								});

								const birthdateSchedule = new BirthdateSchedule({
									_id: mongoose.Types.ObjectId(),
									name: username + ' ' + req.body.name + ' birthdate',
									username: username,
									contact_name: req.body.name,
									day: new_day,
									month: new_month,
									scheduleObject: birthdateScheduleObject
								});

								birthdateSchedule
									.save()
									.then(r => {
										console.log("rslv = ", r);
									})
									.catch(err => {
										console.log("ADDING BIRTHDATESCHEDULE ERRORED ==> ", err);
									});
							}
						})
						.catch(err => {
							console.log(err);
							successfully = false;
						});
				}
			}

			else {
				// if (req.body.birthDate !== null && req.body.birthDate !== undefined) {
				User.findOne({
					username: username
				})
					.exec()
					.then(rs => {
						let phone_number = rs.phone_number;
						if (phone_number !== null && phone_number !== undefined) {
							console.log("Handling Birthdate");
							let new_birthDate = req.body.birthDate;
							// console.log('$$$ ', birthDate);
							// console.log('$$$ ', birthDate.getDay());
							// console.log('$$$ ', birthDate.getMonth());
							// console.log('$$$ ', typeof(birthDate.getDay()));
							// console.log('$$$ ', typeof(birthDate.getMonth()));
							let new_month = Number(new_birthDate.substring(5, 7));
							let new_day = Number(new_birthDate.substring(8, 10));
							let old_month = birthDate.getMonth() + 1;
							let old_day = birthDate.getUTCDate();
							console.log('new_month = ', new_month, ', new_day = ', new_day);
							console.log('old_month = ', old_month, ', old_day = ', old_day);

							if (old_month !== new_month || old_day !== new_day) { // update schedule

								console.log('PPPP');
								BirthdateSchedule.findOne({ username: username, contact_name: contact_name })
									.exec()
									.then(reslv => {
										console.log('CCCC');
										console.log("find BirthdateSchedule reslv = ", reslv);

										if (reslv === null) {
											BirthdateSchedule.findOne({ username: username, contact_name: req.body.name })
												.exec()
												.then(r => {
													console.log("r = ", r);
													let schedule_name = r.name;
													// let day = reslv.day;
													// let month = reslv.month;
													// let splited = schedule_name.split(' ');
													// let contact_name = splited[1];
													// console.log('contact_name = ', contact_name);
													let new_schedule_name = username + ' ' + req.body.name + ' birthdate';

													let job = node_schedule.scheduledJobs[schedule_name];
													if (job === null || job === undefined) {
														console.log('job is null or undefined.');
													}
													else {
														job.cancel();
														// console.log('node_schedule.scheduledJobs = ', node_schedule.scheduledJobs);
														console.log('job canceled');
													}

													let birthdateScheduleObject = node_schedule.scheduleJob(new_schedule_name, '0 0 9 ' + new_day + ' ' + new_month + ' *', function () {
														console.log('Say Happy Birthday!');
														let message = 'سامانه ماش\nامروز تولد ' + req.body.name + ' هست. نمیخوای بهش تبریک بگی؟';

														kavenegarApi.Send({
															message: message,
															sender: "10008663",
															receptor: phone_number
														},
															function (response, status) {
																console.log(response);
																console.log(status);
															});
													});

													BirthdateSchedule.updateOne({ name: schedule_name }, { name: new_schedule_name, contact_name: req.body.name, day: new_day, month: new_month, scheduleObject: birthdateScheduleObject })
														.exec()
														.then(rsl => {
															console.log("rsl = ", rsl);
														})
														.catch(err => {
															console.log(err);
															successfully = false;
														});
												})
												.catch(err => {
													console.log(err);
													successfully = false;
												});
										}
										else {
											let schedule_name = reslv.name;
											// let day = reslv.day;
											// let month = reslv.month;
											// let splited = schedule_name.split(' ');
											// let contact_name = splited[1];
											// console.log('contact_name = ', contact_name);
											let new_schedule_name = username + ' ' + req.body.name + ' birthdate';

											let job = node_schedule.scheduledJobs[schedule_name];
											if (job === null || job === undefined) {
												console.log('job is null or undefined.');
											}
											else {
												job.cancel();
												// console.log('node_schedule.scheduledJobs = ', node_schedule.scheduledJobs);
												console.log('job canceled');
											}

											let birthdateScheduleObject = node_schedule.scheduleJob(new_schedule_name, '0 0 9 ' + new_day + ' ' + new_month + ' *', function () {
												console.log('Say Happy Birthday!');
												let message = 'سامانه ماش\nامروز تولد ' + req.body.name + ' هست. نمیخوای بهش تبریک بگی؟';

												kavenegarApi.Send({
													message: message,
													sender: "10008663",
													receptor: phone_number
												},
													function (response, status) {
														console.log(response);
														console.log(status);
													});
											});

											BirthdateSchedule.updateOne({ name: schedule_name }, { name: new_schedule_name, contact_name: req.body.name, day: new_day, month: new_month, scheduleObject: birthdateScheduleObject })
												.exec()
												.then(r => {
													console.log("r = ", r);
												})
												.catch(err => {
													console.log(err);
													successfully = false;
												});
										}
									})
									.catch(err => {
										console.log(err);
										successfully = false;
									});
							}
							else {
								console.log("ha ha ha");
							}
						}
					}).catch(err => {
						console.log(err);
						successfully = false;
					});
				// }
			}


			if (debt_conToUser === undefined || debt_conToUser === null || debt_conToUser === '') {
				if (req.body.debt_conToUser !== null && req.body.debt_conToUser !== undefined && req.body.debt_conToUser !== '') {  // new schedule
					User.findOne({
						username: username
					})
						.exec()
						.then(rs => {
							let phone_number = rs.phone_number;
							if (phone_number !== null && phone_number !== undefined) { // new schedule
								console.log('gggg');
								console.log("Handling debt_conToUser");
								// let debt_conToUser = values.debt_conToUser;
								// console.log('debt_conToUser = ', debt_conToUser);
								// console.log('typeof(debt_conToUser) = ', typeof (debt_conToUser));

								let debtConToUserScheduleObject = node_schedule.scheduleJob(username + ' ' + req.body.name + ' debt_conToUser', '0 0 9 * * 4', function () {
									console.log('debt_conToUser reminded!');
									let message = 'سامانه ماش\nیادت هست که مبلغ ' + req.body.debt_conToUser + ' تومان از ' + req.body.name + ' طلبکاری؟';

									kavenegarApi.Send({
										message: message,
										sender: "10008663",
										receptor: phone_number
									},
										function (response, status) {
											console.log(response);
											console.log(status);
										});
								});

								const debtConToUserSchedule = new DebtSchedule({
									_id: mongoose.Types.ObjectId(),
									name: username + ' ' + req.body.name + ' debt_conToUser',
									username: username,
									contact_name: req.body.name,
									amount: req.body.debt_conToUser,
									scheduleType: 'debt_conToUser',
									scheduleObject: debtConToUserScheduleObject
								});

								debtConToUserSchedule
									.save()
									.then(rslv => {
										console.log("rslv = ", rslv);
									})
									.catch(err => {
										console.log("ADDING DEBTSCHEDULE ERRORED ==> ", err);
									});
							}
						})
						.catch(err => {
							console.log(err);
							successfully = false;
						});
				}
			}

			else {
				console.log('Hellooooo');
				console.log(req.body.debt_conToUser === '');
				if (req.body.debt_conToUser !== null && req.body.debt_conToUser !== undefined && req.body.debt_conToUser !== '') {
					console.log('Hellooooo 1');

					User.findOne({
						username: username
					})
						.exec()
						.then(rs => {
							let phone_number = rs.phone_number;
							if (phone_number !== null && phone_number !== undefined) {
								if (debt_conToUser !== req.body.debt_conToUser) { // update schedule

									DebtSchedule.findOne({ username: username, contact_name: contact_name, scheduleType: 'debt_conToUser' })
										.exec()
										.then(reslv => {
											console.log("find DebtSchedule reslv = ", reslv);
											console.log("uuuu ");
											if (reslv === null) {
												DebtSchedule.findOne({ username: username, contact_name: req.body.name, scheduleType: 'debt_conToUser' })
													.exec()
													.then(rsl => {
														console.log("find DebtSchedule rsl = ", rsl);

														let schedule_name = rsl.name;
														// let amount = reslv[i].amount;
														// // let splited = schedule_name.split(' ');
														// // let contact_name = splited[1];
														// let debt_type = splited[2];
														// // console.log('contact_name = ', contact_name);
														// console.log('debt_type = ', debt_type);
														let new_schedule_name = username + ' ' + req.body.name + ' debt_conToUser';

														let job = node_schedule.scheduledJobs[schedule_name];
														if (job === null || job === undefined) {
															console.log('job is null or undefined.');
														}
														else {
															job.cancel();
															console.log('job canceled');
														}

														let debtScheduleObject = node_schedule.scheduleJob(new_schedule_name, '0 0 9 * * 4', function () {
															console.log('debt_conToUser reminded!');
															let message = 'سامانه ماش\nیادت هست که مبلغ ' + req.body.debt_conToUser + ' تومان از ' + req.body.name + ' طلبکاری؟';

															kavenegarApi.Send({
																message: message,
																sender: "10008663",
																receptor: phone_number
															},
																function (response, status) {
																	console.log(response);
																	console.log(status);
																});
														});

														DebtSchedule.updateOne({ name: schedule_name }, { name: new_schedule_name, contact_name: req.body.name, amount: req.body.debt_conToUser, scheduleObject: debtScheduleObject })
															.exec()
															.then(r => {
																console.log("r = ", r);
															})
															.catch(err => {
																console.log(err);
																successfully = false;
															});
													})
													.catch(err => {
														console.log(err);
														successfully = false;
													});
											}
											else {
												let schedule_name = reslv.name;
												// let amount = reslv[i].amount;
												// // let splited = schedule_name.split(' ');
												// // let contact_name = splited[1];
												// let debt_type = splited[2];
												// // console.log('contact_name = ', contact_name);
												// console.log('debt_type = ', debt_type);
												let new_schedule_name = username + ' ' + req.body.name + ' debt_conToUser';

												console.log("Im here, schedule_name = ", schedule_name, ", new_schedule_name = ", new_schedule_name);
												console.log(req.body.debt_conToUser);

												let job = node_schedule.scheduledJobs[schedule_name];
												if (job === null || job === undefined) {
													console.log('job is null or undefined.');
												}
												else {
													job.cancel();
													console.log('job canceled');
												}

												let debtScheduleObject = node_schedule.scheduleJob(new_schedule_name, '0 0 9 * * 4', function () {
													console.log('debt_conToUser reminded!');
													let message = 'سامانه ماش\nیادت هست که مبلغ ' + req.body.debt_conToUser + ' تومان از ' + req.body.name + ' طلبکاری؟';

													kavenegarApi.Send({
														message: message,
														sender: "10008663",
														receptor: phone_number
													},
														function (response, status) {
															console.log(response);
															console.log(status);
														});
												});

												DebtSchedule.updateOne({ name: schedule_name }, { name: new_schedule_name, contact_name: req.body.name, amount: req.body.debt_conToUser, scheduleObject: debtScheduleObject })
													.exec()
													.then(r => {
														console.log("r = ", r);
													})
													.catch(err => {
														console.log(err);
														successfully = false;
													});
											}
										})
										.catch(err => {
											console.log(err);
											successfully = false;
										});
								}
							}
						})
						.catch(err => {
							console.log(err);
							successfully = false;
						});
				}

				else { // cancel schedule
					console.log('Hellooooo 2');
					User.findOne({
						username: username
					})
						.exec()
						.then(rs => {
							let phone_number = rs.phone_number;
							if (phone_number !== null && phone_number !== undefined) {

								DebtSchedule.findOne({ username: username, contact_name: contact_name, scheduleType: 'debt_conToUser' })
									.exec()
									.then(reslv => {
										console.log("find DebtSchedule reslv = ", reslv);

										if (reslv === null) {
											DebtSchedule.findOne({ username: username, contact_name: req.body.name, scheduleType: 'debt_conToUser' })
												.exec()
												.then(r => {
													console.log("find DebtSchedule r = ", r);
													let schedule_name = r.name;
													// console.log('reslv[i] = ', reslv[i], ' schedule_name = ', schedule_name);
													// console.log('node_schedule.scheduledJobs = ', node_schedule.scheduledJobs);
													let job = node_schedule.scheduledJobs[schedule_name];
													if (job === null || job === undefined) {
														console.log('job is null or undefined.');
													}
													else {
														job.cancel();
														console.log('job canceled');
													}

													console.log('abc, ', contact_name, ' ', req.body.name);
													DebtSchedule.deleteOne({ username: username, contact_name: contact_name, scheduleType: 'debt_conToUser' })
														.exec()
														.then(reslv => {
															console.log("delete debtSchedule reslv = ", reslv);
														})
														.catch(err => {
															console.log(err);
															successfully = false;
														});

													DebtSchedule.deleteOne({ username: username, contact_name: req.body.name, scheduleType: 'debt_conToUser' })
														.exec()
														.then(reslv => {
															console.log("delete debtSchedule reslv = ", reslv);
														})
														.catch(err => {
															console.log(err);
															successfully = false;
														});
												})
												.catch(err => {
													console.log(err);
													successfully = false;
												});
										}
										else {
											let schedule_name = reslv.name;
											// console.log('reslv[i] = ', reslv[i], ' schedule_name = ', schedule_name);
											// console.log('node_schedule.scheduledJobs = ', node_schedule.scheduledJobs);
											let job = node_schedule.scheduledJobs[schedule_name];
											if (job === null || job === undefined) {
												console.log('job is null or undefined.');
											}
											else {
												job.cancel();
												console.log('job canceled');
											}

											console.log('abc, ', contact_name, ' ', req.body.name);
											DebtSchedule.deleteOne({ username: username, contact_name: contact_name, scheduleType: 'debt_conToUser' })
												.exec()
												.then(reslv => {
													console.log("delete debtSchedule reslv = ", reslv);
												})
												.catch(err => {
													console.log(err);
													successfully = false;
												});

											DebtSchedule.deleteOne({ username: username, contact_name: req.body.name, scheduleType: 'debt_conToUser' })
												.exec()
												.then(reslv => {
													console.log("delete debtSchedule reslv = ", reslv);
												})
												.catch(err => {
													console.log(err);
													successfully = false;
												});
										}
									})
									.catch(err => {
										console.log(err);
										successfully = false;
									});
							}
						})
						.catch(err => {
							console.log(err);
							successfully = false;
						});
				}
			}

			if (debt_userToCon === undefined || debt_userToCon === null || debt_userToCon === '') {
				if (req.body.debt_userToCon !== null && req.body.debt_userToCon !== undefined && req.body.debt_userToCon !== '') {  // new schedule
					User.findOne({
						username: username
					})
						.exec()
						.then(rs => {
							let phone_number = rs.phone_number;
							if (phone_number !== null && phone_number !== undefined) { // new schedule
								console.log("Handling debt_userToCon");
								// let debt_userToCon = values.debt_userToCon;
								// console.log('debt_userToCon = ', debt_userToCon);
								// console.log('typeof(debt_userToCon) = ', typeof (debt_userToCon));

								let debtUserToConScheduleObject = node_schedule.scheduleJob(username + ' ' + req.body.name + ' debt_userToCon', '0 0 9 * * 4', function () {
									console.log('debt_userToCon reminded!');
									let message = 'سامانه ماش\nیادت هست که مبلغ ' + req.body.debt_userToCon + ' تومان به ' + req.body.name + ' بدهکاری؟';

									kavenegarApi.Send({
										message: message,
										sender: "10008663",
										receptor: phone_number
									},
										function (response, status) {
											console.log(response);
											console.log(status);
										});
								});

								const debtUserToConSchedule = new DebtSchedule({
									_id: mongoose.Types.ObjectId(),
									name: username + ' ' + req.body.name + ' debt_userToCon',
									username: username,
									contact_name: req.body.name,
									amount: req.body.debt_userToCon,
									scheduleType: 'debt_userToCon',
									scheduleObject: debtUserToConScheduleObject
								});

								debtUserToConSchedule
									.save()
									.then(rslv => {
										console.log("rslv = ", rslv);
									})
									.catch(err => {
										console.log("ADDING DEBTSCHEDULE ERRORED ==> ", err);
									});
							}
						})
						.catch(err => {
							console.log(err);
							successfully = false;
						});
				}
			}

			else {
				if (req.body.debt_userToCon !== null && req.body.debt_userToCon !== undefined && req.body.debt_userToCon !== '') {
					User.findOne({
						username: username
					})
						.exec()
						.then(rs => {
							let phone_number = rs.phone_number;
							if (phone_number !== null && phone_number !== undefined) {
								if (debt_userToCon !== req.body.debt_userToCon) { // update schedule

									DebtSchedule.findOne({ username: username, contact_name: contact_name, scheduleType: 'debt_userToCon' })
										.exec()
										.then(reslv => {
											console.log("find DebtSchedule reslv = ", reslv);

											if (reslv === null) {
												DebtSchedule.findOne({ username: username, contact_name: req.body.name, scheduleType: 'debt_userToCon' })
													.exec()
													.then(rsl => {
														console.log("find DebtSchedule rsl = ", rsl);

														let schedule_name = rsl.name;
														// let amount = reslv[i].amount;
														// // let splited = schedule_name.split(' ');
														// // let contact_name = splited[1];
														// let debt_type = splited[2];
														// // console.log('contact_name = ', contact_name);
														// console.log('debt_type = ', debt_type);
														let new_schedule_name = username + ' ' + req.body.name + ' debt_userToCon';

														let job = node_schedule.scheduledJobs[schedule_name];
														if (job === null || job === undefined) {
															console.log('job is null or undefined.');
														}
														else {
															job.cancel();
															console.log('job canceled');
														}

														let debtUserToConScheduleObject = node_schedule.scheduleJob(new_schedule_name, '0 0 9 * * 4', function () {
															console.log('debt_userToCon reminded!');
															let message = 'سامانه ماش\nیادت هست که مبلغ ' + req.body.debt_userToCon + ' تومان به ' + req.body.name + ' بدهکاری؟';

															kavenegarApi.Send({
																message: message,
																sender: "10008663",
																receptor: phone_number
															},
																function (response, status) {
																	console.log(response);
																	console.log(status);
																});
														});

														DebtSchedule.updateOne({ name: schedule_name }, { name: new_schedule_name, contact_name: req.body.name, amount: req.body.debt_userToCon, scheduleObject: debtUserToConScheduleObject })
															.exec()
															.then(r => {
																console.log("r = ", r);
															})
															.catch(err => {
																console.log(err);
																successfully = false;
															});
													})
													.catch(err => {
														console.log(err);
														successfully = false;
													});
											}
											else {
												let schedule_name = reslv.name;
												// let amount = reslv[i].amount;
												// // let splited = schedule_name.split(' ');
												// // let contact_name = splited[1];
												// let debt_type = splited[2];
												// // console.log('contact_name = ', contact_name);
												// console.log('debt_type = ', debt_type);
												let new_schedule_name = username + ' ' + req.body.name + ' debt_userToCon';

												let job = node_schedule.scheduledJobs[schedule_name];
												if (job === null || job === undefined) {
													console.log('job is null or undefined.');
												}
												else {
													job.cancel();
													console.log('job canceled');
												}

												let debtUserToConScheduleObject = node_schedule.scheduleJob(new_schedule_name, '0 0 9 * * 4', function () {
													console.log('debt_userToCon reminded!');
													let message = 'سامانه ماش\nیادت هست که مبلغ ' + req.body.debt_userToCon + ' تومان به ' + req.body.name + ' بدهکاری؟';

													kavenegarApi.Send({
														message: message,
														sender: "10008663",
														receptor: phone_number
													},
														function (response, status) {
															console.log(response);
															console.log(status);
														});
												});

												DebtSchedule.updateOne({ name: schedule_name }, { name: new_schedule_name, contact_name: req.body.name, amount: req.body.debt_userToCon, scheduleObject: debtUserToConScheduleObject })
													.exec()
													.then(r => {
														console.log("r = ", r);
													})
													.catch(err => {
														console.log(err);
														successfully = false;
													});
											}
										})
										.catch(err => {
											console.log(err);
											successfully = false;
										});
								}
							}
						})
						.catch(err => {
							console.log(err);
							successfully = false;
						});
				}

				else { // cancel schedule
					User.findOne({
						username: username
					})
						.exec()
						.then(rs => {
							let phone_number = rs.phone_number;
							if (phone_number !== null && phone_number !== undefined) {

								DebtSchedule.findOne({ username: username, contact_name: contact_name, scheduleType: 'debt_userToCon' })
									.exec()
									.then(reslv => {
										console.log("find DebtSchedule reslv = ", reslv);

										if (reslv === null) {
											DebtSchedule.findOne({ username: username, contact_name: req.body.name, scheduleType: 'debt_userToCon' })
												.exec()
												.then(r => {
													console.log("find DebtSchedule r = ", r);
													let schedule_name = r.name;
													// console.log('reslv[i] = ', reslv[i], ' schedule_name = ', schedule_name);
													// console.log('node_schedule.scheduledJobs = ', node_schedule.scheduledJobs);
													let job = node_schedule.scheduledJobs[schedule_name];
													if (job === null || job === undefined) {
														console.log('job is null or undefined.');
													}
													else {
														job.cancel();
														console.log('job canceled');
													}

													console.log('abc, ', contact_name, ' ', req.body.name);
													DebtSchedule.deleteOne({ username: username, contact_name: contact_name, scheduleType: 'debt_userToCon' })
														.exec()
														.then(reslv => {
															console.log("delete debtSchedule reslv = ", reslv);
														})
														.catch(err => {
															console.log(err);
															successfully = false;
														});

													DebtSchedule.deleteOne({ username: username, contact_name: req.body.name, scheduleType: 'debt_userToCon' })
														.exec()
														.then(reslv => {
															console.log("delete debtSchedule reslv = ", reslv);
														})
														.catch(err => {
															console.log(err);
															successfully = false;
														});
												})
												.catch(err => {
													console.log(err);
													successfully = false;
												});
										}
										else {
											let schedule_name = reslv.name;
											// console.log('reslv[i] = ', reslv[i], ' schedule_name = ', schedule_name);
											// console.log('node_schedule.scheduledJobs = ', node_schedule.scheduledJobs);
											let job = node_schedule.scheduledJobs[schedule_name];
											if (job === null || job === undefined) {
												console.log('job is null or undefined.');
											}
											else {
												job.cancel();
												console.log('job canceled');
											}

											console.log('abc, ', contact_name, ' ', req.body.name);
											DebtSchedule.deleteOne({ username: username, contact_name: contact_name, scheduleType: 'debt_userToCon' })
												.exec()
												.then(reslv => {
													console.log("delete debtSchedule reslv = ", reslv);
												})
												.catch(err => {
													console.log(err);
													successfully = false;
												});

											DebtSchedule.deleteOne({ username: username, contact_name: req.body.name, scheduleType: 'debt_userToCon' })
												.exec()
												.then(reslv => {
													console.log("delete debtSchedule reslv = ", reslv);
												})
												.catch(err => {
													console.log(err);
													successfully = false;
												});
										}
									})
									.catch(err => {
										console.log(err);
										successfully = false;
									});
							}
						})
						.catch(err => {
							console.log(err);
							successfully = false;
						});
				}
			}

			if (duration_message === undefined || duration_message === null || duration_message === '') {
				if (req.body.duration_message !== null && req.body.duration_message !== undefined && req.body.duration_message !== '') {  // new schedule
					User.findOne({
						username: username
					})
						.exec()
						.then(rs => {
							let phone_number = rs.phone_number;
							if (phone_number !== null && phone_number !== undefined) { // new schedule
								console.log("Handling duration_message");
								// let debt_userToCon = values.debt_userToCon;
								// console.log('debt_userToCon = ', debt_userToCon);
								// console.log('typeof(debt_userToCon) = ', typeof (debt_userToCon));

								let minutes = req.body.duration_message * 24 * 60;
								let durationMessageScheduleObject = node_schedule.scheduleJob(username + ' ' + req.body.name + ' duration_message', '0 */' + minutes + ' * * * *', function () {
									console.log('duration_message reminded!');
									let message = 'سامانه ماش\nنمیخوای به ' + req.body.name + ' یه پیام بدی؟';

									kavenegarApi.Send({
										message: message,
										sender: "10008663",
										receptor: phone_number
									},
										function (response, status) {
											console.log(response);
											console.log(status);
										});
								});

								const durationMessageSchedule = new RelationSchedule({
									_id: mongoose.Types.ObjectId(),
									name: username + ' ' + req.body.name + ' duration_message',
									username: username,
									contact_name: req.body.name,
									duration: req.body.duration_message,
									scheduleType: 'message',
									scheduleObject: durationMessageScheduleObject
								});

								durationMessageSchedule
									.save()
									.then(rslv => {
										console.log("rslv = ", rslv);
									})
									.catch(err => {
										console.log("ADDING RELATIONSCHEDULE ERRORED ==> ", err);
									});
							}
						})
						.catch(err => {
							console.log(err);
							successfully = false;
						});
				}
			}

			else {
				if (req.body.duration_message !== null && req.body.duration_message !== undefined && req.body.duration_message !== '') {
					User.findOne({
						username: username
					})
						.exec()
						.then(rs => {
							let phone_number = rs.phone_number;
							if (phone_number !== null && phone_number !== undefined) {
								if (duration_message !== req.body.duration_message) { // update schedule

									RelationSchedule.findOne({ username: username, contact_name: contact_name, scheduleType: 'message' })
										.exec()
										.then(reslv => {
											console.log("find RelationSchedule reslv = ", reslv);

											if (reslv === null) {
												RelationSchedule.findOne({ username: username, contact_name: req.body.name, scheduleType: 'message' })
													.exec()
													.then(rsl => {
														console.log("find RelationSchedule rsl = ", rsl);

														let schedule_name = rsl.name;
														// let amount = reslv[i].amount;
														// // let splited = schedule_name.split(' ');
														// // let contact_name = splited[1];
														// let debt_type = splited[2];
														// // console.log('contact_name = ', contact_name);
														// console.log('debt_type = ', debt_type);
														let new_schedule_name = username + ' ' + req.body.name + ' duration_message';

														let job = node_schedule.scheduledJobs[schedule_name];
														if (job === null || job === undefined) {
															console.log('job is null or undefined.');
														}
														else {
															job.cancel();
															console.log('job canceled');
														}

														let minutes = req.body.duration_message * 24 * 60;
														let durationMessageScheduleObject = node_schedule.scheduleJob(new_schedule_name, '0 */' + minutes + ' * * * *', function () {
															console.log('duration_message reminded!');
															let message = 'سامانه ماش\nنمیخوای به ' + req.body.name + ' یه پیام بدی؟';

															kavenegarApi.Send({
																message: message,
																sender: "10008663",
																receptor: phone_number
															},
																function (response, status) {
																	console.log(response);
																	console.log(status);
																});
														});

														RelationSchedule.updateOne({ name: schedule_name }, { name: new_schedule_name, contact_name: req.body.name, duration: req.body.duration_message, scheduleObject: durationMessageScheduleObject })
															.exec()
															.then(r => {
																console.log("r = ", r);
															})
															.catch(err => {
																console.log(err);
																successfully = false;
															});
													})
													.catch(err => {
														console.log(err);
														successfully = false;
													});
											}
											else {
												let schedule_name = reslv.name;
												// let amount = reslv[i].amount;
												// // let splited = schedule_name.split(' ');
												// // let contact_name = splited[1];
												// let debt_type = splited[2];
												// // console.log('contact_name = ', contact_name);
												// console.log('debt_type = ', debt_type);
												let new_schedule_name = username + ' ' + req.body.name + ' duration_message';

												let job = node_schedule.scheduledJobs[schedule_name];
												if (job === null || job === undefined) {
													console.log('job is null or undefined.');
												}
												else {
													job.cancel();
													console.log('job canceled');
												}

												let minutes = req.body.duration_message * 24 * 60;
												let durationMessageScheduleObject = node_schedule.scheduleJob(new_schedule_name, '0 */' + minutes + ' * * * *', function () {
													console.log('duration_message reminded!');
													let message = 'سامانه ماش\nنمیخوای به ' + req.body.name + ' یه پیام بدی؟';

													kavenegarApi.Send({
														message: message,
														sender: "10008663",
														receptor: phone_number
													},
														function (response, status) {
															console.log(response);
															console.log(status);
														});
												});

												RelationSchedule.updateOne({ name: schedule_name }, { name: new_schedule_name, contact_name: req.body.name, duration: req.body.duration_message, scheduleObject: durationMessageScheduleObject })
													.exec()
													.then(r => {
														console.log("r = ", r);
													})
													.catch(err => {
														console.log(err);
														successfully = false;
													});
											}
										})
										.catch(err => {
											console.log(err);
											successfully = false;
										});
								}
							}
						})
						.catch(err => {
							console.log(err);
							successfully = false;
						});
				}

				else { // cancel schedule
					User.findOne({
						username: username
					})
						.exec()
						.then(rs => {
							let phone_number = rs.phone_number;
							if (phone_number !== null && phone_number !== undefined) {

								RelationSchedule.findOne({ username: username, contact_name: contact_name, scheduleType: 'message' })
									.exec()
									.then(reslv => {
										console.log("find RelationSchedule reslv = ", reslv);

										if (reslv === null) {
											RelationSchedule.findOne({ username: username, contact_name: req.body.name, scheduleType: 'message' })
												.exec()
												.then(r => {
													console.log("find RelationSchedule r = ", r);
													let schedule_name = r.name;
													// console.log('reslv[i] = ', reslv[i], ' schedule_name = ', schedule_name);
													// console.log('node_schedule.scheduledJobs = ', node_schedule.scheduledJobs);
													let job = node_schedule.scheduledJobs[schedule_name];
													if (job === null || job === undefined) {
														console.log('job is null or undefined.');
													}
													else {
														job.cancel();
														console.log('job canceled');
													}

													console.log('abc, ', contact_name, ' ', req.body.name);
													RelationSchedule.deleteOne({ username: username, contact_name: contact_name, scheduleType: 'message' })
														.exec()
														.then(reslv => {
															console.log("delete RelationSchedule reslv = ", reslv);
														})
														.catch(err => {
															console.log(err);
															successfully = false;
														});

													RelationSchedule.deleteOne({ username: username, contact_name: req.body.name, scheduleType: 'message' })
														.exec()
														.then(reslv => {
															console.log("delete RelationSchedule reslv = ", reslv);
														})
														.catch(err => {
															console.log(err);
															successfully = false;
														});
												})
												.catch(err => {
													console.log(err);
													successfully = false;
												});
										}
										else {
											let schedule_name = reslv.name;
											// console.log('reslv[i] = ', reslv[i], ' schedule_name = ', schedule_name);
											// console.log('node_schedule.scheduledJobs = ', node_schedule.scheduledJobs);
											let job = node_schedule.scheduledJobs[schedule_name];
											if (job === null || job === undefined) {
												console.log('job is null or undefined.');
											}
											else {
												job.cancel();
												console.log('job canceled');
											}

											console.log('abc, ', contact_name, ' ', req.body.name);
											RelationSchedule.deleteOne({ username: username, contact_name: contact_name, scheduleType: 'message' })
												.exec()
												.then(reslv => {
													console.log("delete RelationSchedule reslv = ", reslv);
												})
												.catch(err => {
													console.log(err);
													successfully = false;
												});

											RelationSchedule.deleteOne({ username: username, contact_name: req.body.name, scheduleType: 'message' })
												.exec()
												.then(reslv => {
													console.log("delete RelationSchedule reslv = ", reslv);
												})
												.catch(err => {
													console.log(err);
													successfully = false;
												});
										}
									})
									.catch(err => {
										console.log(err);
										successfully = false;
									});
							}
						})
						.catch(err => {
							console.log(err);
							successfully = false;
						});
				}
			}

			if (duration_call === undefined || duration_call === null || duration_call === '') {
				if (req.body.duration_call !== null && req.body.duration_call !== undefined && req.body.duration_call !== '') {  // new schedule
					User.findOne({
						username: username
					})
						.exec()
						.then(rs => {
							let phone_number = rs.phone_number;
							if (phone_number !== null && phone_number !== undefined) { // new schedule
								console.log("Handling duration_call");
								// let debt_userToCon = values.debt_userToCon;
								// console.log('debt_userToCon = ', debt_userToCon);
								// console.log('typeof(debt_userToCon) = ', typeof (debt_userToCon));

								let minutes = req.body.duration_call * 24 * 60;
								let durationCallScheduleObject = node_schedule.scheduleJob(username + ' ' + req.body.name + ' duration_call', '0 */' + minutes + ' * * * *', function () {
									console.log('duration_call reminded!');
									let message = 'سامانه ماش\nنمیخوای با ' + req.body.name + ' یه تماس بگیری؟';

									kavenegarApi.Send({
										message: message,
										sender: "10008663",
										receptor: phone_number
									},
										function (response, status) {
											console.log(response);
											console.log(status);
										});
								});

								const durationCallSchedule = new RelationSchedule({
									_id: mongoose.Types.ObjectId(),
									name: username + ' ' + req.body.name + ' duration_call',
									username: username,
									contact_name: req.body.name,
									duration: req.body.duration_call,
									scheduleType: 'call',
									scheduleObject: durationCallScheduleObject
								});

								durationCallSchedule
									.save()
									.then(rslv => {
										console.log("rslv = ", rslv);
									})
									.catch(err => {
										console.log("ADDING RELATIONSCHEDULE ERRORED ==> ", err);
									});
							}
						})
						.catch(err => {
							console.log(err);
							successfully = false;
						});
				}
			}

			else {
				if (req.body.duration_call !== null && req.body.duration_call !== undefined && req.body.duration_call !== '') {
					User.findOne({
						username: username
					})
						.exec()
						.then(rs => {
							let phone_number = rs.phone_number;
							if (phone_number !== null && phone_number !== undefined) {
								if (duration_call !== req.body.duration_call) { // update schedule

									RelationSchedule.findOne({ username: username, contact_name: contact_name, scheduleType: 'call' })
										.exec()
										.then(reslv => {
											console.log("find RelationSchedule reslv = ", reslv);

											if (reslv === null) {
												RelationSchedule.findOne({ username: username, contact_name: req.body.name, scheduleType: 'call' })
													.exec()
													.then(rsl => {
														console.log("find RelationSchedule rsl = ", rsl);

														let schedule_name = rsl.name;
														// let amount = reslv[i].amount;
														// // let splited = schedule_name.split(' ');
														// // let contact_name = splited[1];
														// let debt_type = splited[2];
														// // console.log('contact_name = ', contact_name);
														// console.log('debt_type = ', debt_type);
														let new_schedule_name = username + ' ' + req.body.name + ' duration_call';

														let job = node_schedule.scheduledJobs[schedule_name];
														if (job === null || job === undefined) {
															console.log('job is null or undefined.');
														}
														else {
															job.cancel();
															console.log('job canceled');
														}

														let minutes = req.body.duration_call * 24 * 60;
														let durationCallScheduleObject = node_schedule.scheduleJob(new_schedule_name, '0 */' + minutes + ' * * * *', function () {
															console.log('duration_call reminded!');
															let message = 'سامانه ماش\nنمیخوای با ' + req.body.name + ' یه تماس بگیری؟';

															kavenegarApi.Send({
																message: message,
																sender: "10008663",
																receptor: phone_number
															},
																function (response, status) {
																	console.log(response);
																	console.log(status);
																});
														});

														RelationSchedule.updateOne({ name: schedule_name }, { name: new_schedule_name, contact_name: req.body.name, duration: req.body.duration_call, scheduleObject: durationCallScheduleObject })
															.exec()
															.then(r => {
																console.log("r = ", r);
															})
															.catch(err => {
																console.log(err);
																successfully = false;
															});
													})
													.catch(err => {
														console.log(err);
														successfully = false;
													});
											}
											else {
												let schedule_name = reslv.name;
												// let amount = reslv[i].amount;
												// // let splited = schedule_name.split(' ');
												// // let contact_name = splited[1];
												// let debt_type = splited[2];
												// // console.log('contact_name = ', contact_name);
												// console.log('debt_type = ', debt_type);
												let new_schedule_name = username + ' ' + req.body.name + ' duration_call';

												let job = node_schedule.scheduledJobs[schedule_name];
												if (job === null || job === undefined) {
													console.log('job is null or undefined.');
												}
												else {
													job.cancel();
													console.log('job canceled');
												}

												let minutes = req.body.duration_call * 24 * 60;
												let durationCallScheduleObject = node_schedule.scheduleJob(new_schedule_name, '0 */' + minutes + ' * * * *', function () {
													console.log('duration_call reminded!');
													let message = 'سامانه ماش\nنمیخوای با ' + req.body.name + ' یه تماس بگیری؟';

													kavenegarApi.Send({
														message: message,
														sender: "10008663",
														receptor: phone_number
													},
														function (response, status) {
															console.log(response);
															console.log(status);
														});
												});

												RelationSchedule.updateOne({ name: schedule_name }, { name: new_schedule_name, contact_name: req.body.name, duration: req.body.duration_call, scheduleObject: durationCallScheduleObject })
													.exec()
													.then(r => {
														console.log("r = ", r);
													})
													.catch(err => {
														console.log(err);
														successfully = false;
													});
											}
										})
										.catch(err => {
											console.log(err);
											successfully = false;
										});
								}
							}
						})
						.catch(err => {
							console.log(err);
							successfully = false;
						});
				}

				else { // cancel schedule
					User.findOne({
						username: username
					})
						.exec()
						.then(rs => {
							let phone_number = rs.phone_number;
							if (phone_number !== null && phone_number !== undefined) {

								RelationSchedule.findOne({ username: username, contact_name: contact_name, scheduleType: 'call' })
									.exec()
									.then(reslv => {
										console.log("find RelationSchedule reslv = ", reslv);

										if (reslv === null) {
											RelationSchedule.findOne({ username: username, contact_name: req.body.name, scheduleType: 'call' })
												.exec()
												.then(r => {
													console.log("find RelationSchedule r = ", r);
													let schedule_name = r.name;
													// console.log('reslv[i] = ', reslv[i], ' schedule_name = ', schedule_name);
													// console.log('node_schedule.scheduledJobs = ', node_schedule.scheduledJobs);
													let job = node_schedule.scheduledJobs[schedule_name];
													if (job === null || job === undefined) {
														console.log('job is null or undefined.');
													}
													else {
														job.cancel();
														console.log('job canceled');
													}

													console.log('abc, ', contact_name, ' ', req.body.name);
													RelationSchedule.deleteOne({ username: username, contact_name: contact_name, scheduleType: 'call' })
														.exec()
														.then(reslv => {
															console.log("delete RelationSchedule reslv = ", reslv);
														})
														.catch(err => {
															console.log(err);
															successfully = false;
														});

													RelationSchedule.deleteOne({ username: username, contact_name: req.body.name, scheduleType: 'call' })
														.exec()
														.then(reslv => {
															console.log("delete RelationSchedule reslv = ", reslv);
														})
														.catch(err => {
															console.log(err);
															successfully = false;
														});
												})
												.catch(err => {
													console.log(err);
													successfully = false;
												});
										}
										else {
											let schedule_name = reslv.name;
											// console.log('reslv[i] = ', reslv[i], ' schedule_name = ', schedule_name);
											// console.log('node_schedule.scheduledJobs = ', node_schedule.scheduledJobs);
											let job = node_schedule.scheduledJobs[schedule_name];
											if (job === null || job === undefined) {
												console.log('job is null or undefined.');
											}
											else {
												job.cancel();
												console.log('job canceled');
											}

											console.log('abc, ', contact_name, ' ', req.body.name);
											RelationSchedule.deleteOne({ username: username, contact_name: contact_name, scheduleType: 'call' })
												.exec()
												.then(reslv => {
													console.log("delete RelationSchedule reslv = ", reslv);
												})
												.catch(err => {
													console.log(err);
													successfully = false;
												});

											RelationSchedule.deleteOne({ username: username, contact_name: req.body.name, scheduleType: 'call' })
												.exec()
												.then(reslv => {
													console.log("delete RelationSchedule reslv = ", reslv);
												})
												.catch(err => {
													console.log(err);
													successfully = false;
												});
										}
									})
									.catch(err => {
										console.log(err);
										successfully = false;
									});
							}
						})
						.catch(err => {
							console.log(err);
							successfully = false;
						});
				}
			}

			if (duration_meeting === undefined || duration_meeting === null || duration_meeting === '') {
				if (req.body.duration_meeting !== null && req.body.duration_meeting !== undefined && req.body.duration_meeting !== '') {  // new schedule
					User.findOne({
						username: username
					})
						.exec()
						.then(rs => {
							let phone_number = rs.phone_number;
							if (phone_number !== null && phone_number !== undefined) { // new schedule
								console.log("Handling duration_meeting");
								// let debt_userToCon = values.debt_userToCon;
								// console.log('debt_userToCon = ', debt_userToCon);
								// console.log('typeof(debt_userToCon) = ', typeof (debt_userToCon));

								let minutes = req.body.duration_meeting * 24 * 60;
								let durationMeetingScheduleObject = node_schedule.scheduleJob(username + ' ' + req.body.name + ' duration_meeting', '0 */' + minutes + ' * * * *', function () {
									console.log('duration_meeting reminded!');
									let message = 'سامانه ماش\nنمیخوای با ' + req.body.name + ' یه قرار ملاقات بذاری؟';

									kavenegarApi.Send({
										message: message,
										sender: "10008663",
										receptor: phone_number
									},
										function (response, status) {
											console.log(response);
											console.log(status);
										});
								});

								const durationMeetingSchedule = new RelationSchedule({
									_id: mongoose.Types.ObjectId(),
									name: username + ' ' + req.body.name + ' duration_meeting',
									username: username,
									contact_name: req.body.name,
									duration: req.body.duration_meeting,
									scheduleType: 'meeting',
									scheduleObject: durationMeetingScheduleObject
								});

								durationMeetingSchedule
									.save()
									.then(rslv => {
										console.log("rslv = ", rslv);
									})
									.catch(err => {
										console.log("ADDING RELATIONSCHEDULE ERRORED ==> ", err);
									});
							}
						})
						.catch(err => {
							console.log(err);
							successfully = false;
						});
				}
			}

			else {
				if (req.body.duration_meeting !== null && req.body.duration_meeting !== undefined && req.body.duration_meeting !== '') {
					User.findOne({
						username: username
					})
						.exec()
						.then(rs => {
							let phone_number = rs.phone_number;
							if (phone_number !== null && phone_number !== undefined) {
								if (duration_meeting !== req.body.duration_meeting) { // update schedule

									RelationSchedule.findOne({ username: username, contact_name: contact_name, scheduleType: 'meeting' })
										.exec()
										.then(reslv => {
											console.log("find RelationSchedule reslv = ", reslv);

											if (reslv === null) {
												RelationSchedule.findOne({ username: username, contact_name: req.body.name, scheduleType: 'meeting' })
													.exec()
													.then(rsl => {
														console.log("find RelationSchedule rsl = ", rsl);

														let schedule_name = rsl.name;
														// let amount = reslv[i].amount;
														// // let splited = schedule_name.split(' ');
														// // let contact_name = splited[1];
														// let debt_type = splited[2];
														// // console.log('contact_name = ', contact_name);
														// console.log('debt_type = ', debt_type);
														let new_schedule_name = username + ' ' + req.body.name + ' duration_meeting';

														let job = node_schedule.scheduledJobs[schedule_name];
														if (job === null || job === undefined) {
															console.log('job is null or undefined.');
														}
														else {
															job.cancel();
															console.log('job canceled');
														}

														let minutes = req.body.duration_meeting * 24 * 60;
														let durationMeetingScheduleObject = node_schedule.scheduleJob(new_schedule_name, '0 */' + minutes + ' * * * *', function () {
															console.log('duration_meeting reminded!');
															let message = 'سامانه ماش\nنمیخوای با ' + req.body.name + ' یه قرار ملاقات بذاری؟';

															kavenegarApi.Send({
																message: message,
																sender: "10008663",
																receptor: phone_number
															},
																function (response, status) {
																	console.log(response);
																	console.log(status);
																});
														});

														RelationSchedule.updateOne({ name: schedule_name }, { name: new_schedule_name, contact_name: req.body.name, duration: req.body.duration_meeting, scheduleObject: durationMeetingScheduleObject })
															.exec()
															.then(r => {
																console.log("r = ", r);
															})
															.catch(err => {
																console.log(err);
																successfully = false;
															});
													})
													.catch(err => {
														console.log(err);
														successfully = false;
													});
											}
											else {
												let schedule_name = reslv.name;
												// let amount = reslv[i].amount;
												// // let splited = schedule_name.split(' ');
												// // let contact_name = splited[1];
												// let debt_type = splited[2];
												// // console.log('contact_name = ', contact_name);
												// console.log('debt_type = ', debt_type);
												let new_schedule_name = username + ' ' + req.body.name + ' duration_meeting';

												let job = node_schedule.scheduledJobs[schedule_name];
												if (job === null || job === undefined) {
													console.log('job is null or undefined.');
												}
												else {
													job.cancel();
													console.log('job canceled');
												}

												let minutes = req.body.duration_meeting * 24 * 60;
												let durationMeetingScheduleObject = node_schedule.scheduleJob(new_schedule_name, '0 */' + minutes + ' * * * *', function () {
													console.log('duration_meeting reminded!');
													let message = 'سامانه ماش\nنمیخوای با ' + req.body.name + ' یه قرار ملاقات بذاری؟';

													kavenegarApi.Send({
														message: message,
														sender: "10008663",
														receptor: phone_number
													},
														function (response, status) {
															console.log(response);
															console.log(status);
														});
												});

												RelationSchedule.updateOne({ name: schedule_name }, { name: new_schedule_name, contact_name: req.body.name, duration: req.body.duration_meeting, scheduleObject: durationMeetingScheduleObject })
													.exec()
													.then(r => {
														console.log("r = ", r);
													})
													.catch(err => {
														console.log(err);
														successfully = false;
													});
											}
										})
										.catch(err => {
											console.log(err);
											successfully = false;
										});
								}
							}
						})
						.catch(err => {
							console.log(err);
							successfully = false;
						});
				}

				else { // cancel schedule
					User.findOne({
						username: username
					})
						.exec()
						.then(rs => {
							let phone_number = rs.phone_number;
							if (phone_number !== null && phone_number !== undefined) {

								RelationSchedule.findOne({ username: username, contact_name: contact_name, scheduleType: 'meeting' })
									.exec()
									.then(reslv => {
										console.log("find RelationSchedule reslv = ", reslv);

										if (reslv === null) {
											RelationSchedule.findOne({ username: username, contact_name: req.body.name, scheduleType: 'meeting' })
												.exec()
												.then(r => {
													console.log("find RelationSchedule r = ", r);
													let schedule_name = r.name;
													// console.log('reslv[i] = ', reslv[i], ' schedule_name = ', schedule_name);
													// console.log('node_schedule.scheduledJobs = ', node_schedule.scheduledJobs);
													let job = node_schedule.scheduledJobs[schedule_name];
													if (job === null || job === undefined) {
														console.log('job is null or undefined.');
													}
													else {
														job.cancel();
														console.log('job canceled');
													}

													console.log('abc, ', contact_name, ' ', req.body.name);
													RelationSchedule.deleteOne({ username: username, contact_name: contact_name, scheduleType: 'meeting' })
														.exec()
														.then(reslv => {
															console.log("delete RelationSchedule reslv = ", reslv);
														})
														.catch(err => {
															console.log(err);
															successfully = false;
														});

													RelationSchedule.deleteOne({ username: username, contact_name: req.body.name, scheduleType: 'meeting' })
														.exec()
														.then(reslv => {
															console.log("delete RelationSchedule reslv = ", reslv);
														})
														.catch(err => {
															console.log(err);
															successfully = false;
														});
												})
												.catch(err => {
													console.log(err);
													successfully = false;
												});
										}
										else {
											let schedule_name = reslv.name;
											// console.log('reslv[i] = ', reslv[i], ' schedule_name = ', schedule_name);
											// console.log('node_schedule.scheduledJobs = ', node_schedule.scheduledJobs);
											let job = node_schedule.scheduledJobs[schedule_name];
											if (job === null || job === undefined) {
												console.log('job is null or undefined.');
											}
											else {
												job.cancel();
												console.log('job canceled');
											}

											console.log('abc, ', contact_name, ' ', req.body.name);
											RelationSchedule.deleteOne({ username: username, contact_name: contact_name, scheduleType: 'meeting' })
												.exec()
												.then(reslv => {
													console.log("delete RelationSchedule reslv = ", reslv);
												})
												.catch(err => {
													console.log(err);
													successfully = false;
												});

											RelationSchedule.deleteOne({ username: username, contact_name: req.body.name, scheduleType: 'meeting' })
												.exec()
												.then(reslv => {
													console.log("delete RelationSchedule reslv = ", reslv);
												})
												.catch(err => {
													console.log(err);
													successfully = false;
												});
										}
									})
									.catch(err => {
										console.log(err);
										successfully = false;
									});
							}
						})
						.catch(err => {
							console.log(err);
							successfully = false;
						});
				}
			}
		})
		.catch(err => {
			console.log(err);
			successfully = false;
		});

	if (successfully === true) {
		res.status(200).json({
			message: 'Contact updated successfully.',
		});
	}
	else {
		res.status(500).json({
			message: 'Error in updating the contact.'
		});
	}
});

// Delete contact
router.delete("/deleteContact/:username/:contact_name", (req, res) => {
	let username = req.params.username;
	let contact_name = req.params.contact_name;
	let successfully = true;

	Contact.deleteOne({
		username: username,
		name: contact_name
	})
		.exec()
		.then(resolve => {
			console.log(resolve);

			Group.find({
				username: username
			})
				.exec()
				.then(reslv => {
					reslv.map((group, index) => {
						let group_contacts = group.contacts;
						let group_name = group.name;
						if (group_contacts.includes(contact_name) === true) {
							group_contacts = group_contacts.filter(function (val, index, arr) { return val !== contact_name });
							Group.updateOne({ username: username, name: group_name }, { contacts: group_contacts })
								.exec()
								.then(r => {
									console.log(r);
								})
								.catch(err => {
									console.log(err);
									successfully = false;
								});
						}
					})
				})
				.catch(err => {
					console.log(err);
					successfully = false;
				});

			BirthdateSchedule.findOne({ username: username, contact_name: contact_name })
				.exec()
				.then(reslv => {
					console.log("find BirthdateSchedule reslv = ", reslv);
					if (reslv !== null) {
						let schedule_name = reslv.name;
						// console.log('schedule_name = ', schedule_name);
						// console.log('1 node_schedule.scheduledJobs = ', node_schedule.scheduledJobs);
						let job = node_schedule.scheduledJobs[schedule_name];
						if (job === null || job === undefined) {
							console.log('job is null or undefined.');
						}
						else {
							job.cancel();
							console.log('job canceled');
						}

						BirthdateSchedule.deleteOne({ username: username, contact_name: contact_name })
							.exec()
							.then(reslv => {
								console.log("delete birthdateSchedule reslv = ", reslv);
							})
							.catch(err => {
								console.log(err);
								successfully = false;
							});
					}
				})
				.catch(err => {
					console.log(err);
					successfully = false;
				});

			DebtSchedule.find({ username: username, contact_name: contact_name })
				.exec()
				.then(reslv => {
					console.log("find DebtSchedule reslv = ", reslv);
					for (let i = 0; i < reslv.length; i++) {

						let schedule_name = reslv[i].name;
						// console.log('reslv[i] = ', reslv[i], ' schedule_name = ', schedule_name);
						// console.log('node_schedule.scheduledJobs = ', node_schedule.scheduledJobs);
						let job = node_schedule.scheduledJobs[schedule_name];
						if (job === null || job === undefined) {
							console.log('job is null or undefined.');
						}
						else {
							job.cancel();
							console.log('job canceled');
						}
					}

					DebtSchedule.deleteMany({ username: username, contact_name: contact_name })
						.exec()
						.then(reslv => {
							console.log("delete debtSchedule reslv = ", reslv);
						})
						.catch(err => {
							console.log(err);
							successfully = false;
						});
				})
				.catch(err => {
					console.log(err);
					successfully = false;
				});

			RelationSchedule.find({ username: username, contact_name: contact_name })
				.exec()
				.then(reslv => {
					console.log("find RelationSchedule reslv = ", reslv);
					for (let i = 0; i < reslv.length; i++) {

						let schedule_name = reslv[i].name;
						// console.log('reslv[i] = ', reslv[i], ' schedule_name = ', schedule_name);
						// console.log('node_schedule.scheduledJobs = ', node_schedule.scheduledJobs);
						let job = node_schedule.scheduledJobs[schedule_name];
						if (job === null || job === undefined) {
							console.log('job is null or undefined.');
						}
						else {
							job.cancel();
							console.log('job canceled');
						}
					}

					RelationSchedule.deleteMany({ username: username, contact_name: contact_name })
						.exec()
						.then(reslv => {
							console.log("delete RelationSchedule reslv = ", reslv);
						})
						.catch(err => {
							console.log(err);
							successfully = false;
						});
				})
				.catch(err => {
					console.log(err);
					successfully = false;
				});
		})
		.catch(err => {
			console.log(err);
			successfully = false;
		});

	if (successfully === true) {
		res.status(200).json({
			message: 'Contact deleted successfully.',
		});
	}
	else {
		res.status(500).json({
			message: 'Error in deleting the contact.'
		});
	}
});

// CRUD for group
// Create group
router.put("/addGroup", (req, res) => {
	let values = req.body.values;
	const group = new Group({
		_id: mongoose.Types.ObjectId(),
		username: req.body.username,
		name: values.name,
		note: values.note,
		contacts: values.contacts
	});

	group
		.save()
		.then(resolve => {
			console.log("ADDING GROUP RESOLVED ==> ", resolve);
			res.status(200).json({
				message: "group added successfully.",
				group
			});
		})
		.catch(err => {
			console.log("ADDING GROUP ERRORED ==> ", err);
			res.status(500).json({
				error: err
			});
		});
});

// Read group
router.get("/getGroup/:username/:group_name", (req, res) => {
	let group_name = req.params.group_name;
	let username = req.params.username;
	Group.findOne({
		name: group_name,
		username: username
	})
		.exec()
		.then(resolve => {
			console.log(resolve);
			res.status(200).json(resolve);
		})
		.catch(err => {
			console.log(err);
			res.status(500).json({ error: err });
		});
});

// Read groups
router.get("/getGroups/:username", (req, res) => {
	let username = req.params.username;
	Group.find({
		username: username
	})
		.exec()
		.then(resolve => {
			console.log(resolve);
			res.status(200).json(resolve);
		})
		.catch(err => {
			console.log(err);
			res.status(500).json({ error: err });
		});
});

// Update group
router.patch("/updateGroup/:username/:group_name", (req, res) => {
	let username = req.params.username;
	let group_name = req.params.group_name;
	let successfully = true;

	Group.updateOne({ username: username, name: group_name }, req.body)
		.exec()
		.then(resolve => {
			console.log(resolve);

			if (group_name !== req.body.name) {
				Contact.find({
					username: username
				})
					.exec()
					.then(reslv => {
						reslv.map((contact, index) => {
							let contact_groups = contact.groups;
							let contact_name = contact.name;
							if (contact_groups.includes(group_name) === true) {
								contact_groups = contact_groups.filter(function (val, index, arr) { return val !== group_name });
								contact_groups.push(req.body.name);
								Contact.updateOne({ username: username, name: contact_name }, { groups: contact_groups })
									.exec()
									.then(r => {
										console.log(r);
									})
									.catch(err => {
										console.log(err);
										successfully = false;
									});
							}
						})
					})
					.catch(err => {
						console.log(err);
						successfully = false;
					});
			}
		})
		.catch(err => {
			console.log(err);
			successfully = false;
		});

	if (successfully === true) {
		res.status(200).json({
			message: 'Group updated successfully.',
		});
	}
	else {
		res.status(500).json({
			message: 'Error in updating the group.'
		});
	}
});

// Delete group
router.delete("/deleteGroup/:username/:group_name", (req, res) => {
	let username = req.params.username;
	let group_name = req.params.group_name;
	let successfully = true;

	Group.deleteOne({
		username: username,
		name: group_name
	})
		.exec()
		.then(resolve => {
			console.log(resolve);

			Contact.find({
				username: username
			})
				.exec()
				.then(reslv => {
					reslv.map((contact, index) => {
						let contact_groups = contact.groups;
						let contact_name = contact.name;
						if (contact_groups.includes(group_name) === true) {
							contact_groups = contact_groups.filter(function (val, index, arr) { return val !== group_name });
							Contact.updateOne({ username: username, name: contact_name }, { groups: contact_groups })
								.exec()
								.then(r => {
									console.log(r);
								})
								.catch(err => {
									console.log(err);
									successfully = false;
								});
						}
					})
				})
				.catch(err => {
					console.log(err);
					successfully = false;
				});
		})
		.catch(err => {
			console.log(err);
			successfully = false;
		});

	if (successfully === true) {
		res.status(200).json({
			message: 'Group deleted successfully.',
		});
	}
	else {
		res.status(500).json({
			message: 'Error in deleting the group.'
		});
	}
});

// Add contacts to a group
router.put("/addContactToGroup", (req, res) => {
	let contacts_names = req.body.contacts_names;
	let group_name = req.body.group_name;
	let username = req.body.username;
	let successfully = true;

	Group.updateOne({ username: username, name: group_name }, { contacts: contacts_names })
		.exec()
		.then(resolve => {
			console.log(resolve);

			Contact.find({
				username: username
			})
				.exec()
				.then(reslv => {
					reslv.map((contact, index) => {
						let contact_groups = contact.groups;
						let contact_name = contact.name;
						if (contacts_names.includes(contact_name) === true) {
							if (contact_groups.includes(group_name) === false) {
								contact_groups.push(group_name);
								Contact.updateOne({ username: username, name: contact_name }, { groups: contact_groups })
									.exec()
									.then(r => {
										console.log(r);
									})
									.catch(err => {
										console.log(err);
										successfully = false;
									});
							}
						}
						else {
							if (contact_groups.includes(group_name) === true) {
								contact_groups = contact_groups.filter(function (val, index, arr) { return val !== group_name });
								Contact.updateOne({ username: username, name: contact_name }, { groups: contact_groups })
									.exec()
									.then(r => {
										console.log(r);
									})
									.catch(err => {
										console.log(err);
										successfully = false;
									});
							}
						}
					})
				}).catch(err => {
					console.log(err);
					successfully = false;
				});

			if (successfully === true) {
				res.status(200).json({
					message: 'Contacts added to group successfully.',
				});
			}
			else {
				res.status(500).json({
					message: 'Error in adding contacts to group.'
				});
			}
		});
});

// Authentication
router.get("/auth/:username/:password", (req, res) => {
	var username = req.params.username;
	var password = req.params.password;
	console.log("username: ", username, ", password: ", password);
	User.findOne({
		username: username
	})
		.exec()
		.then(resolve => {
			console.log(resolve);
			if (resolve === null) {
				res.status(200).json({
					message: 'not existed'
				});
			}
			else if (resolve.password === password) {
				res.status(200).json({
					message: 'login',
					user: resolve
				});
			}
			else {
				res.status(200).json({
					message: 'not login'
				});
			}
		})
		.catch(err => {
			console.log(err);
			res.status(500).json({ error: err });
		});
});

// Send SMS
router.put("/sendSMS/:phone_number/:username", (req, res) => {
	let phone_number = req.params.phone_number;
	let username = req.params.username;
	let token = Math.floor(Math.random() * 9000) + 1000;
	fetch(`https://api.kavenegar.com/v1/6369352B674A66434345645633586A70352F4674414A61347565557142424A6A6A313053456B76413030673D/verify/lookup.json?receptor=${phone_number}&token=${token}&template=Verify`, {
		method: "GET",
		headers: {
			Accept: "application/json"
		}
	}).then(response => {
		console.log("response = ", response);
		if (response.ok) {
			response.json().then(json => {
				console.log("Verification json = ", json);

				VerifyToken.deleteMany({
					username: username
				})
					.exec()
					.then(rslv => {
						console.log(rslv);
					})
					.catch(err => {
						console.log(err);
					});

				const verifyToken = new VerifyToken({
					_id: mongoose.Types.ObjectId(),
					username: username,
					phone_number: phone_number,
					token: token,
					send_date: new Date()
				});

				verifyToken
					.save()
					.then(resolve => {
						console.log("ADDING VERIFYTOKEN RESOLVED ==> ", resolve);
						res.status(200).json({
							message: "verifyToken added successfully."
						});
					})
					.catch(error => {
						console.log("ADDING VERIFYTOKEN ERRORED ==> ", error);
						res.status(500).json({
							error: err
						});
					});
			})
		}
	}).catch(err => {
		console.log(err)
	});
});

// Verification Phone Number
router.get("/verifyPhoneNumber/:phone_number/:input_code/:username", (req, res) => {
	let phone_number = req.params.phone_number;
	let input_code = req.params.input_code;
	let username = req.params.username;
	console.log("req.params.phone_number = ", phone_number);
	console.log("req.params.input_code = ", input_code);
	console.log("req.params.username = ", username);

	VerifyToken.findOne({
		phone_number: phone_number,
		username: username
	})
		.exec()
		.then(resolve => {
			console.log(resolve);
			if (resolve === null) {
				console.log("resolve is null");
				res.status(500).json({ error: "resolve is null" });
			}
			else if (resolve === undefined) {
				console.log("resolve is undefined");
				res.status(500).json({ error: "resolve is undefined" });
			}
			else {
				console.log("resolve.token.toString() = ", resolve.token.toString());
				console.log("input_code = ", input_code);
				if (resolve.token.toString() === input_code) {
					if (new Date() - resolve.send_date > 60000) {
						res.status(200).json({
							message: 'expired'
						});
					}

					else {
						User.findOne({ username: username })
							.exec()
							.then(rsl => {
								let previous_phone_number = rsl.phone_number;

								if (previous_phone_number !== null && previous_phone_number !== undefined) {
									console.log('hhhhh');
									BirthdateSchedule.find({ username: username })
										.exec()
										.then(reslv => {
											console.log("find BirthdateSchedule reslv = ", reslv);
											for (let i = 0; i < reslv.length; i++) {

												let schedule_name = reslv[i].name;
												let day = reslv[i].day;
												let month = reslv[i].month;
												let splited = schedule_name.split(' ');
												let contact_name = splited[1];
												console.log('contact_name = ', contact_name);

												let job = node_schedule.scheduledJobs[schedule_name];
												if (job === null || job === undefined) {
													console.log('job is null or undefined.');
												}
												else {
													job.cancel();
													// console.log('node_schedule.scheduledJobs = ', node_schedule.scheduledJobs);
													console.log('job canceled');
												}

												let birthdateScheduleObject = node_schedule.scheduleJob(schedule_name, '0 0 9 ' + day + ' ' + month + ' *', function () {
													console.log('Say Happy Birthday!');
													let message = 'سامانه ماش\nامروز تولد ' + contact_name + ' هست. نمیخوای بهش تبریک بگی؟';

													kavenegarApi.Send({
														message: message,
														sender: "10008663",
														receptor: phone_number
													},
														function (response, status) {
															console.log(response);
															console.log(status);
														});
												});

												BirthdateSchedule.updateOne({ name: schedule_name }, { scheduleObject: birthdateScheduleObject })
													.exec()
													.then(r => {
														console.log("r = ", r);
													})
													.catch(err => {
														console.log(err);
													});
											}
										})
										.catch(err => {
											console.log(err);
										});

									DebtSchedule.find({ username: username })
										.exec()
										.then(reslv => {
											console.log("find DebtSchedule reslv = ", reslv);
											for (let i = 0; i < reslv.length; i++) {

												let schedule_name = reslv[i].name;
												let amount = reslv[i].amount;
												let splited = schedule_name.split(' ');
												let contact_name = splited[1];
												let debt_type = splited[2];
												console.log('contact_name = ', contact_name);
												console.log('debt_type = ', debt_type);

												let job = node_schedule.scheduledJobs[schedule_name];
												if (job === null || job === undefined) {
													console.log('job is null or undefined.');
												}
												else {
													job.cancel();
													console.log('job canceled');
												}

												let debtScheduleObject = node_schedule.scheduleJob(schedule_name, '0 0 9 * * 4', function () {
													console.log(debt_type, ' reminded!');
													let message;
													if (debt_type === 'debt_userToCon') {
														message = 'سامانه ماش\nیادت هست که مبلغ ' + amount + ' تومان به ' + contact_name + ' بدهکاری؟';
													}
													else {
														message = 'سامانه ماش\nیادت هست که مبلغ ' + amount + ' تومان از ' + contact_name + ' طلبکاری؟';
													}

													kavenegarApi.Send({
														message: message,
														sender: "10008663",
														receptor: phone_number
													},
														function (response, status) {
															console.log(response);
															console.log(status);
														});
												});

												DebtSchedule.updateOne({ name: schedule_name }, { scheduleObject: debtScheduleObject })
													.exec()
													.then(r => {
														console.log("r = ", r);
													})
													.catch(err => {
														console.log(err);
													});
											}
										})
										.catch(err => {
											console.log(err);
										});

									RelationSchedule.find({ username: username })
										.exec()
										.then(reslv => {
											console.log("find RelationSchedule reslv = ", reslv);
											for (let i = 0; i < reslv.length; i++) {

												let schedule_name = reslv[i].name;
												let duration = reslv[i].duration;
												let scheduleType = reslv[i].scheduleType;
												let splited = schedule_name.split(' ');
												let contact_name = splited[1];
												console.log('contact_name = ', contact_name);
												let minutes = duration * 24 * 60;

												let job = node_schedule.scheduledJobs[schedule_name];
												if (job === null || job === undefined) {
													console.log('job is null or undefined.');
												}
												else {
													job.cancel();
													// console.log('node_schedule.scheduledJobs = ', node_schedule.scheduledJobs);
													console.log('job canceled');
												}

												let relationScheduleObject = node_schedule.scheduleJob(schedule_name, '0 */' + minutes + ' * * * *', function () {
													console.log(scheduleType + ' reminded!');
													let message;
													if (scheduleType === 'message') {
														message = 'سامانه ماش\nنمیخوای به ' + contact_name + ' یه پیام بدی؟';
													}
													else if (scheduleType === 'call') {
														message = 'سامانه ماش\nنمیخوای با ' + contact_name + ' یه تماس بگیری؟';
													}
													else if (scheduleType === 'meeting') {
														message = 'سامانه ماش\nنمیخوای با ' + contact_name + ' یه قرار ملاقات بذاری؟';
													}
													else {
														message = '';
													}

													kavenegarApi.Send({
														message: message,
														sender: "10008663",
														receptor: phone_number
													},
														function (response, status) {
															console.log(response);
															console.log(status);
														});
												});

												RelationSchedule.updateOne({ name: schedule_name }, { scheduleObject: relationScheduleObject })
													.exec()
													.then(r => {
														console.log("r = ", r);
													})
													.catch(err => {
														console.log(err);
													});
											}
										})
										.catch(err => {
											console.log(err);
										});
								}
								else {
									console.log('ggggg');
									Contact.find({ username: username })
										.exec()
										.then(reslv => {
											console.log('ggggg reslv = ', reslv);
											for (let i = 0; i < reslv.length; i++) {

												if (reslv[i].birthDate !== null && reslv[i].birthDate !== undefined && reslv[i].birthDate !== '') {
													console.log("Handling Birthdate");
													let birthDate = reslv[i].birthDate;
													let month = Number(birthDate.substring(5, 7));
													let day = Number(birthDate.substring(8, 10));

													let birthdateScheduleObject = node_schedule.scheduleJob(username + ' ' + reslv[i].name + ' birthdate', '0 0 9 ' + day + ' ' + month + ' *', function () {
														console.log('Say Happy Birthday!');
														let message = 'سامانه ماش\nامروز تولد ' + reslv[i].name + ' هست. نمیخوای بهش تبریک بگی؟';

														kavenegarApi.Send({
															message: message,
															sender: "10008663",
															receptor: phone_number
														},
															function (response, status) {
																console.log(response);
																console.log(status);
															});
													});

													const birthdateSchedule = new BirthdateSchedule({
														_id: mongoose.Types.ObjectId(),
														name: username + ' ' + reslv[i].name + ' birthdate',
														username: username,
														contact_name: reslv[i].name,
														day: day,
														month: month,
														scheduleObject: birthdateScheduleObject
													});

													birthdateSchedule
														.save()
														.then(rslv => {
															console.log("rslv = ", rslv);
														})
														.catch(err => {
															console.log("ADDING BIRTHDATESCHEDULE ERRORED ==> ", err);
														});
												}

												if (reslv[i].debt_userToCon !== null && reslv[i].debt_userToCon !== undefined && reslv[i].debt_userToCon !== '') {
													console.log("Handling debt_userToCon");
													let debt_userToCon = reslv[i].debt_userToCon;
													console.log('debt_userToCon = ', debt_userToCon);
													console.log('typeof(debt_userToCon) = ', typeof (debt_userToCon));

													let debtUserToConScheduleObject = node_schedule.scheduleJob(username + ' ' + reslv[i].name + ' debt_userToCon', '0 0 9 * * 4', function () {
														console.log('debt_userToCon reminded!');
														let message = 'سامانه ماش\nیادت هست که مبلغ ' + debt_userToCon + ' تومان به ' + reslv[i].name + ' بدهکاری؟';

														kavenegarApi.Send({
															message: message,
															sender: "10008663",
															receptor: phone_number
														},
															function (response, status) {
																console.log(response);
																console.log(status);
															});
													});

													const debtUserToConSchedule = new DebtSchedule({
														_id: mongoose.Types.ObjectId(),
														name: username + ' ' + reslv[i].name + ' debt_userToCon',
														username: username,
														contact_name: reslv[i].name,
														amount: debt_userToCon,
														scheduleType: 'debt_userToCon',
														scheduleObject: debtUserToConScheduleObject
													});

													debtUserToConSchedule
														.save()
														.then(rslv => {
															console.log("rslv = ", rslv);
														})
														.catch(err => {
															console.log("ADDING DEBTSCHEDULE ERRORED ==> ", err);
														});
												}

												if (reslv[i].debt_conToUser !== null && reslv[i].debt_conToUser !== undefined && reslv[i].debt_conToUser !== '') {
													console.log("Handling debt_conToUser");
													let debt_conToUser = reslv[i].debt_conToUser;
													console.log('debt_conToUser = ', debt_conToUser);
													console.log('typeof(debt_conToUser) = ', typeof (debt_conToUser));

													let debtConToUserScheduleObject = node_schedule.scheduleJob(username + ' ' + reslv[i].name + ' debt_conToUser', '0 0 9 * * 4', function () {
														console.log('debt_conToUser reminded!');
														let message = 'سامانه ماش\nیادت هست که مبلغ ' + debt_conToUser + ' تومان از ' + reslv[i].name + ' طلبکاری؟';

														kavenegarApi.Send({
															message: message,
															sender: "10008663",
															receptor: phone_number
														},
															function (response, status) {
																console.log(response);
																console.log(status);
															});
													});

													const debtConToUserSchedule = new DebtSchedule({
														_id: mongoose.Types.ObjectId(),
														name: username + ' ' + reslv[i].name + ' debt_conToUser',
														username: username,
														contact_name: reslv[i].name,
														amount: debt_conToUser,
														scheduleType: 'debt_conToUser',
														scheduleObject: debtConToUserScheduleObject
													});

													debtConToUserSchedule
														.save()
														.then(rslv => {
															console.log("rslv = ", rslv);
														})
														.catch(err => {
															console.log("ADDING DEBTSCHEDULE ERRORED ==> ", err);
														});
												}

												if (reslv[i].duration_message !== null && reslv[i].duration_message !== undefined && reslv[i].duration_message !== '') {
													console.log("Handling duration_message");
													let duration_message = reslv[i].duration_message;
													console.log('duration_message = ', duration_message);
													console.log('typeof(duration_message) = ', typeof (duration_message));

													let minutes = duration_message * 24 * 60;
													let durationMessageScheduleObject = node_schedule.scheduleJob(username + ' ' + reslv[i].name + ' duration_message', '0 */' + minutes + ' * * * *', function () {
														console.log('duration_message reminded!');
														let message = 'سامانه ماش\nنمیخوای به ' + reslv[i].name + ' یه پیام بدی؟';

														kavenegarApi.Send({
															message: message,
															sender: "10008663",
															receptor: phone_number
														},
															function (response, status) {
																console.log(response);
																console.log(status);
															});
													});

													const durationMessageSchedule = new RelationSchedule({
														_id: mongoose.Types.ObjectId(),
														name: username + ' ' + reslv[i].name + ' duration_message',
														username: username,
														contact_name: reslv[i].name,
														duration: duration_message,
														scheduleType: 'message',
														scheduleObject: durationMessageScheduleObject
													});

													durationMessageSchedule
														.save()
														.then(rslv => {
															console.log("rslv = ", rslv);
														})
														.catch(err => {
															console.log("ADDING DURATIONSCHEDULE ERRORED ==> ", err);
														});
												}

												if (reslv[i].duration_call !== null && reslv[i].duration_call !== undefined && reslv[i].duration_call !== '') {
													console.log("Handling duration_call");
													let duration_call = reslv[i].duration_call;
													console.log('duration_call = ', duration_call);
													console.log('typeof(duration_call) = ', typeof (duration_call));

													let minutes = duration_call * 24 * 60;
													console.log('minutes = ', minutes);
													let durationCallScheduleObject = node_schedule.scheduleJob(username + ' ' + reslv[i].name + ' duration_call', '0 */' + minutes + ' * * * *', function () {
														console.log('duration_call reminded!');
														let message = 'سامانه ماش\nنمیخوای با ' + reslv[i].name + ' یه تماس بگیری؟';

														kavenegarApi.Send({
															message: message,
															sender: "10008663",
															receptor: phone_number
														},
															function (response, status) {
																console.log(response);
																console.log(status);
															});
													});

													const durationCallSchedule = new RelationSchedule({
														_id: mongoose.Types.ObjectId(),
														name: username + ' ' + reslv[i].name + ' duration_call',
														username: username,
														contact_name: reslv[i].name,
														duration: duration_call,
														scheduleType: 'call',
														scheduleObject: durationCallScheduleObject
													});

													durationCallSchedule
														.save()
														.then(rslv => {
															console.log("rslv = ", rslv);
														})
														.catch(err => {
															console.log("ADDING DURATIONSCHEDULE ERRORED ==> ", err);
														});
												}

												if (reslv[i].duration_meeting !== null && reslv[i].duration_meeting !== undefined && reslv[i].duration_meeting !== '') {
													console.log("Handling duration_meeting");
													let duration_meeting = reslv[i].duration_meeting;
													console.log('duration_meeting = ', duration_meeting);
													console.log('typeof(duration_meeting) = ', typeof (duration_meeting));

													let minutes = duration_meeting * 24 * 60;
													let durationMeetingScheduleObject = node_schedule.scheduleJob(username + ' ' + reslv[i].name + ' duration_meeting', '0 */' + minutes + ' * * * *', function () {
														console.log('duration_meeting reminded!');
														let message = 'سامانه ماش\nنمیخوای با ' + reslv[i].name + ' یه قرار ملاقات بذاری؟';

														kavenegarApi.Send({
															message: message,
															sender: "10008663",
															receptor: phone_number
														},
															function (response, status) {
																console.log(response);
																console.log(status);
															});
													});

													const durationMeetingSchedule = new RelationSchedule({
														_id: mongoose.Types.ObjectId(),
														name: username + ' ' + reslv[i].name + ' duration_meeting',
														username: username,
														contact_name: reslv[i].name,
														duration: duration_meeting,
														scheduleType: 'meeting',
														scheduleObject: durationMeetingScheduleObject
													});

													durationMeetingSchedule
														.save()
														.then(rslv => {
															console.log("rslv = ", rslv);
														})
														.catch(err => {
															console.log("ADDING DURATIONSCHEDULE ERRORED ==> ", err);
														});
												}
											}
										})
										.catch(err => {
											console.log(err);
										});
								}
							})
							.catch(err => {
								console.log(err);
							});

						res.status(200).json({
							message: 'verified'
						});
					}
				}
				else {
					res.status(200).json({
						message: 'not verified'
					});
				}
			}
		})
		.catch(err => {
			console.log(err);
			res.status(500).json({ error: err });
		});
});

module.exports = router;