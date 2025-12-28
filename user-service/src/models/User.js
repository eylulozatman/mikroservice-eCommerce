class User {
  constructor(username, name, surname, gender, isAdmin) {
    this.username = username;
    this.name = name;
    this.surname = surname;
    this.gender = gender;
    this.isAdmin = isAdmin || false;
  }
}

module.exports = User;
