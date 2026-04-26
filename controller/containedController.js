import express from "express";
import countries from "../data/countries.json" with { type: "json" };
import visitedCountries from "../data/visited_countries.json" with { type: "json" };
import users from "../data/users.json" with { type: "json" };

// Initialize express
const app = express();

let travelerCountries = countries;
let travelerVisitedCountries = visitedCountries;
let travelerUser = users;
const LOW_CONTRAST_COLORS = ["pink", "yellow"];

async function getFirstUser(req, res, next) {
  const firstTraveler = travelerUser[0];

  if (firstTraveler) {
    res.locals.firstUserId = firstTraveler.id ?? null;
    res.locals.firstUserName = firstTraveler.name ?? null;
    res.locals.firstUserColor = firstTraveler.color ?? null;
  } else {
    res.locals.firstUserId = null;
    res.locals.firstUserName = null;
    res.locals.firstUserColor = "teal";
  }
  next();
}

app.use(getFirstUser);

let errors = null;

app.use((req, res, next) => {
  if (!req.session.currentUserId) {
    req.session.currentUserId = res.locals.firstUserId;
  }
  next();
});

function getAccentColor(color) {
  return LOW_CONTRAST_COLORS.includes(color) ? "black" : "white";
}

function getCurrentTraveler(req, res) {
  const sessionUserId = req.session.currentUserId;
  const sessionUser = travelerUser.find((traveler) => traveler.id === sessionUserId);

  if (sessionUser) {
    return {
      currentUserId: sessionUser.id,
      currentUser: sessionUser.name,
      currentColor: sessionUser.color ?? "teal",
      accentColor: getAccentColor(sessionUser.color),
    };
  }

  if (res.locals.firstUserId) {
    req.session.currentUserId = res.locals.firstUserId;

    return {
      currentUserId: res.locals.firstUserId,
      currentUser: res.locals.firstUserName,
      currentColor: res.locals.firstUserColor ?? "teal",
      accentColor: getAccentColor(res.locals.firstUserColor),
    };
  }

  req.session.currentUserId = null;

  return {
    currentUserId: null,
    currentUser: null,
    currentColor: "teal",
    accentColor: "white",
  };
}

function getCountries(currentUserId) {
  // Get all countries
  const allCountries = travelerCountries;

  // Get all visited countries
  const visitedCountries = travelerVisitedCountries.filter(
    (country) => country.user_id === currentUserId,
  );

  // Create a new set of visited countries
  const codesToRemove = new Set(
    visitedCountries.map((item) => item.country_code),
  );

  // Filter out all the visited countries to the main countries list
  const result = allCountries.filter(
    (item) => !codesToRemove.has(item.country_code),
  );

  return result;
}

function getUsers() {
  const results = travelerUser.toSorted((a, b) => a.name.localeCompare(b.name));

  return results.map((user) => {
    return {
      ...user,
      accentColor: getAccentColor(user.color),
    };
  });
}

function checkVisited(currentUserId) {
  const results = travelerVisitedCountries.reduce((acc, item) => {
    if (item.user_id === currentUserId) acc.push(item.country_code);
    return acc;
  }, []);

  return results;
}

function nextTravelerId() {
  const nextId =
    travelerUser.length > 0
      ? Math.max(...travelerUser.map((user) => user.id)) + 1
      : 1;

  return nextId;
}

function capitalizeName(name) {
  return name
    .toLowerCase() // Start by making everything lowercase
    .replace(/(^|[\s\-\'])\S/g, (match) => match.toUpperCase());
}

export function getTracker(req, res) {
  const { currentUserId, currentUser, currentColor, accentColor } =
    getCurrentTraveler(req, res);
  const countries = getCountries(currentUserId);
  const countryCodes = checkVisited(currentUserId);
  const users = getUsers();

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
}

export function addVisitedCountries(req, res) {
  const countryCode = req.body.country;
  const { currentUserId } = getCurrentTraveler(req, res);

  if (!currentUserId) {
    res.redirect("/");
    return;
  }

  travelerVisitedCountries.push({
    country_code: countryCode,
    user_id: currentUserId,
  });

  res.redirect("/");
}

export function getTraveler(req, res) {
  const user = Number(req.body.user);
  const deleteUser = Number(req.body.deleteUser);

  if (user) {
    const userInfo = travelerUser.find((traveler) => traveler.id === user);

    if (userInfo) {
      req.session.currentUserId = userInfo.id;
    }

    res.redirect("/");
  } else if (deleteUser) {
    const visitedCountries = travelerVisitedCountries.filter(
      (item) => item.user_id !== deleteUser,
    );
    const deletedUser = travelerUser.filter((user) => user.id !== deleteUser);

    travelerVisitedCountries = visitedCountries;
    travelerUser = deletedUser;
    req.session.currentUserId = null;

    res.redirect("/");
  } else {
    res.render("new.ejs");
  }
}

export async function addNewTraveler(req, res) {
  const newUser = req.body.name;
  const color = req.body.color;
  const cleanName = capitalizeName(newUser);

  // Check if the name already exists in the array
  const exists = travelerUser.some(
    (item) => item.name.toLowerCase() === newUser.toLowerCase(),
  );

  if (!exists) {
    const nextId = nextTravelerId();

    travelerUser.push({
      id: nextId,
      name: cleanName,
      color: color,
    });

    req.session.currentUserId = nextId;

    res.redirect("/");
  } else {
    const errorMessage = cleanName + " is already a traveler.";
    res.render("new.ejs", {
      error: errorMessage,
    });
  }
}

export async function clearVisitedCountries(req, res) {
  const { currentUserId } = getCurrentTraveler(req, res);

  if (currentUserId) {
    const deleteVisitedCountries = travelerVisitedCountries.filter(
      (country) => country.user_id !== currentUserId,
    );

    travelerVisitedCountries = deleteVisitedCountries;
    res.redirect("/");
  } else {
    res.render("new.ejs");
  }
}
