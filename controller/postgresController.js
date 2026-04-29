import express from "express";
import { query } from "../db/index.js";

const LOW_CONTRAST_COLORS = ["pink", "yellow"];

let currentUserId = null;
let currentUser = null;
let currentColor = "teal";
let accentColor = "white";
let errors = null;

function getAccentColor(color) {
  return LOW_CONTRAST_COLORS.includes(color) ? "black" : "white";
}

async function getCountries() {
  try {
    // Get all countries
    const resCountries = await query(
      "SELECT country_code, country_name FROM countries ORDER BY country_name ASC",
    );

    // Get all visited countries
    const resCountryCodes = await query(
      "SELECT country_code FROM visited_countries WHERE user_id = $1",
      [currentUserId],
    );

    const countriesAll = resCountries.rows;
    const visitedRows = resCountryCodes.rows;

    // Create a new set of visited countries
    const codesToRemove = new Set(visitedRows.map((item) => item.country_code));

    // Filter out all the visited countries to the main countries list
    const result = countriesAll.filter(
      (item) => !codesToRemove.has(item.country_code),
    );

    return result;
  } catch (error) {
    console.error("Error fetching countries:", error);
    errors = "Error fetching countries:";
  }
}

async function getUsers() {
  try {
    const result = await query("SELECT * FROM users ORDER BY name ASC");

    return result.rows.map((user) => {
      return {
        ...user,
        accentColor: getAccentColor(user.color),
      };
    });
  } catch (error) {
    console.log("There was an error looking for users: ", error);
    errors = "There was an error looking for users";
  }
}

async function checkVisited() {
  try {
    const result = await query(
      "SELECT country_code FROM visited_countries WHERE user_id = $1",
      [currentUserId],
    );

    let countryCodes = [];

    result.rows.forEach((country) => {
      countryCodes.push(country.country_code);
    });

    errors = null;

    return countryCodes;
  } catch (error) {
    console.log("There an error looking for visited countries: ", error);
    errors = "There an error looking for visited countries.";
  }
}

function capitalizeName(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/(^|[\s\-\'])\S/g, (match) => match.toUpperCase());
}

export async function getTracker(req, res) {
  try {
    const countries = await getCountries();
    const countryCodes = await checkVisited();
    const users = await getUsers();

    res.render("index.ejs", {
      countries: countries,
      countryCodes: countryCodes,
      total: countryCodes?.length || 0,
      users: users,
      currentUserId: currentUserId,
      currentUser: currentUser,
      currentColor: currentColor,
      accentColor: accentColor,
      error: errors,
    });
  } catch (error) {
    console.log("There was an error staring Travelers Tracker: ", error);
    error = "There was an error staring Travelers Tracker";
  }
}

export async function addVisitedCountries(req, res) {
  const countryCode = req.body.country;

  try {
    // Add visited country
    await query(
      "INSERT INTO visited_countries (country_code, user_id) VALUES ($1, $2)",
      [countryCode, currentUserId],
    );

    res.redirect("/");
  } catch (err) {
    console.error("Error inserting country code:", err);
    error = "No duplicate countries allowed";
  }
}

export async function getTraveler(req, res) {
  const user = Number(req.body.user);
  const deleteUser = Number(req.body.deleteUser);

  if (user) {
    try {
      const userInfo = await query("SELECT * FROM users WHERE id = $1", [user]);

      currentUserId = user;
      currentUser = userInfo.rows[0].name;
      currentColor = userInfo.rows[0].color;
      accentColor = getAccentColor(userInfo.rows[0].color);

      errors = null;

      res.redirect("/");
      return;
    } catch (error) {
      console.log("There an error looking for a user: ", error);
      errors = "There an error looking for a user.";

      res.redirect("/");
      return;
    }
  } else if (deleteUser) {
    try {
      await query("DELETE FROM visited_countries WHERE user_id = $1", [
        deleteUser,
      ]);

      await query("DELETE FROM users WHERE id = $1", [deleteUser]);

      currentUserId = null;
      currentUser = null;
      currentColor = "Teal";
      accentColor = "White";

      res.redirect("/");
      return;
    } catch (error) {
      console.log("There an error deleting a user: ", error);
      errors = "There an error deleting a user.";

      res.redirect("/");
      return;
    }
  }

  res.render("new.ejs");
}

export async function addNewTraveler(req, res) {
  const newUser = req.body.name;
  const color = req.body.color;
  const cleanName = capitalizeName(newUser);

  try {
    const user = await query(
      "INSERT INTO users (name, color) VALUES ($1, $2) RETURNING *",
      [cleanName, color],
    );

    currentUserId = user.rows[0].id;
    currentUser = user.rows[0].name;
    currentColor = user.rows[0].color;
    accentColor = getAccentColor(user.rows[0].color);

    res.redirect("/");
  } catch (error) {
    console.log("There was an error adding a new user: ", error);

    const duplicateName = error.toString();

    if (duplicateName.includes("users_name_key")) {
      errors = cleanName + " is already a traveler.";
    } else {
      errors = "There was an error adding a new user.";
    }

    res.render("new.ejs", {
      error: errors,
    });
  }
}

export async function clearVisitedCountries(req, res) {
  const userid = req.body.currentUserId;

  if (userid) {
    try {
      await query("DELETE FROM visited_countries WHERE user_id = $1", [userid]);

      res.redirect("/");
    } catch (error) {
      console.log("There was an error deleting visited history: ", error);
      errors = "There was an error deleting visited history.";
    }
  } else {
    res.render("new.ejs");
  }
}
