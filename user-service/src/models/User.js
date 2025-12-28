class User {
  constructor(username, name, isAdmin) {
    this.username = username;
    this.name = name;
    this.isAdmin = isAdmin || false;
  }
}

module.exports = User;
