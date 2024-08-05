const Sequelize = require('sequelize');

class Book extends Sequelize.Model {
  static init(sequelize) {
    return super.init({
      title: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      author: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      img: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      meetingDate: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      MemberId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
    }, {
      sequelize,
      timestamps: false,
      underscored: false,
      modelName: 'Book',
      tableName: 'books',
      paranoid: false,
      charset: 'utf8',
      collate: 'utf8_general_ci',
    })
  }

  static associate(db) {
    db.Book.hasMany(db.Review, { foreignKey: 'BookId', sourceKey: 'id'}); 
  }
}

class Member extends Sequelize.Model {
  static init(sequelize) {
    return super.init({
      type: {
        type: Sequelize.STRING(10),
        allowNull: false,
        defaultValue: 'GUEST',
      },
      email: {
        type: Sequelize.STRING(100),
        allowNull: true,
        unique: true
      },
      nick: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      password: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      provider: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'local',
      },
      snsId: {
        type: Sequelize.STRING(300),
        allowNull: true,
      },
    }, {
      sequelize,
      timestamps: false,
      underscored: false,
      modelName: 'Member',
      tableName: 'members',
      paranoid: false,
      charset: 'utf8mb4',
      collate: 'utf8mb4_general_ci',
    })
  }

  static associate(db) {
    db.Member.hasMany(db.Review, { foreignKey: 'MemberId', sourceKey: 'id'}); 
    db.Member.belongsToMany(db.Review, { through: 'ReviewLike'}); 
    db.Member.hasMany(db.Folder, { foreignKey: 'MemberId', sourceKey: 'id'}); 
    db.Member.hasMany(db.List, { foreignKey: 'MemberId', sourceKey: 'id'}); 
    db.Member.hasMany(db.DoneList, { foreignKey: 'MemberId', sourceKey: 'id'}); 
  }
}

class Attend extends Sequelize.Model {
  static init(sequelize) {
    return super.init({
      BookId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      MemberId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
    }, {
      sequelize,
      timestamps: false,
      underscored: false,
      modelName: 'Attend',
      tableName: 'attend',
      paranoid: false,
      charset: 'utf8',
      collate: 'utf8_general_ci',
    })
  }
}

class Review extends Sequelize.Model {
  static init(sequelize) {
    return super.init({
      title: {
        type: Sequelize.STRING(300),
        allowNull: false,
      },
      text: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      like: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
      },
      overText: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
      },
      stars: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
      },
    }, {
      sequelize,
      timestamps: true,
      underscored: false,
      modelName: 'Review',
      tableName: 'reviews',
      paranoid: false,
      charset: 'utf8mb4',
      collate: 'utf8mb4_general_ci',
    })
  }

  static associate(db) {
    db.Review.belongsTo(db.Member, { foreignKey: 'MemberId', targetKey: 'id'}); 
    db.Review.belongsTo(db.Book, { foreignKey: 'BookId', targetKey: 'id'}); 
    db.Review.belongsToMany(db.Member, { through: 'ReviewLike'}); 
  }
}


class Folder extends Sequelize.Model {
  static init(sequelize) {
    return super.init({
      title: {
        type: Sequelize.STRING(15),
        allowNull: false,
      },
      count: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      public: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
      },
    }, {
      sequelize,
      timestamps: true,
      underscored: false,
      modelName: 'Folder',
      tableName: 'folders',
      paranoid: false,
      charset: 'utf8mb4',
      collate: 'utf8mb4_general_ci',
    })
  }
  static associate(db) {
    db.Folder.belongsTo(db.Member, { foreignKey: 'MemberId', targetKey: 'id'}); 
    db.Folder.hasMany(db.List, { foreignKey: 'FolderId', sourceKey: 'id'}); 
    db.Folder.hasMany(db.DoneList, { foreignKey: 'FolderId', sourceKey: 'id'}); 
  }
}

class List extends Sequelize.Model {
  static init(sequelize) {
    return super.init({
      title: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      author: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      img: {
        type: Sequelize.STRING(500),
        allowNull: false,
        defaultValue: '',
      },
    }, {
      sequelize,
      timestamps: true,
      underscored: false,
      modelName: 'List',
      tableName: 'lists',
      paranoid: false,
      charset: 'utf8mb4',
      collate: 'utf8mb4_general_ci',
    })
  }

  static associate(db) {
    db.List.belongsTo(db.Folder, { foreignKey: 'FolderId', targetKey: 'id'});
    db.List.belongsTo(db.Member, { foreignKey: 'MemberId', targetKey: 'id'});
  }
}

class DoneFolder extends Sequelize.Model {
  static init(sequelize) {
    return super.init({
      count: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      public: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
      },
      MemberId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
    }, {
      sequelize,
      timestamps: false,
      underscored: false,
      modelName: 'DoneFolder',
      tableName: 'doneFolders',
      paranoid: false,
      charset: 'utf8',
      collate: 'utf8_general_ci',
    })
  }
}

class DoneList extends Sequelize.Model {
  static init(sequelize) {
    return super.init({
      title: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      author: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      img: {
        type: Sequelize.STRING(500),
        allowNull: false,
        defaultValue: '',
      },
    }, {
      sequelize,
      timestamps: true,
      underscored: false,
      modelName: 'DoneList',
      tableName: 'doneList',
      paranoid: false,
      charset: 'utf8mb4',
      collate: 'utf8mb4_general_ci',
    })
  }

  static associate(db) {
    db.DoneList.belongsTo(db.Folder, { foreignKey: 'FolderId', targetKey: 'id'});
    db.DoneList.belongsTo(db.Member, { foreignKey: 'MemberId', targetKey: 'id'});
  }
}

class Sort extends Sequelize.Model {
  static init(sequelize) {
    return super.init({
      MemberId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      sort: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      order: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
    }, {
      sequelize,
      timestamps: false,
      underscored: false,
      modelName: 'Sort',
      tableName: 'sorts',
      paranoid: false,
      charset: 'utf8',
      collate: 'utf8_general_ci',
    })
  }
}

class Quote extends Sequelize.Model {
  static init(sequelize) {
    return super.init({
      img: {
        type: Sequelize.STRING(500),
        allowNull: false,
      },
    }, {
      sequelize,
      timestamps: true,
      underscored: false,
      modelName: 'Quote',
      tableName: 'quotes',
      paranoid: false,
      charset: 'utf8',
      collate: 'utf8_general_ci',
    })
  }
}

class Favorite extends Sequelize.Model {
  static init(sequelize) {
    return super.init({
      title: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      types: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      img: {
        type: Sequelize.STRING(500),
        allowNull: false,
      },
      explanation: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      modelName: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      round: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
    }, {
      sequelize,
      timestamps: false,
      underscored: false,
      modelName: 'Favorite',
      tableName: 'favorite',
      paranoid: false,
      charset: 'utf8',
      collate: 'utf8_general_ci',
    })
  }
}

function makeCategory (opt) {
  class Category extends Sequelize.Model {
    static init(sequelize) {
      return super.init({
        main: {
          type: Sequelize.STRING(100),
          allowNull: false,
        },
        sub: {
          type: Sequelize.STRING(100),
          allowNull: false,
        },
        selected: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
        win: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
        finalWin: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
      }, {
        sequelize,
        timestamps: false,
        underscored: false,
        paranoid: false,
        charset: 'utf8mb4',
        collate: 'utf8mb4_general_ci',
        ...opt
      })
    }  
  }
  return Category;
}
const TS = makeCategory({
  modelName: 'TS',
  tableName: 'ts',
});
const POP = makeCategory({
  modelName: 'POP',
  tableName: 'pop',
});
const KPOP = makeCategory({
  modelName: 'KPOP',
  tableName: 'kpop',
});
const HFC = makeCategory({
  modelName: 'HFC',
  tableName: 'hfc',
});
const KFC = makeCategory({
  modelName: 'KFC',
  tableName: 'kfc',
});
const HMC = makeCategory({
  modelName: 'HMC',
  tableName: 'hmc',
});
const KMC = makeCategory({
  modelName: 'KMC',
  tableName: 'kmc',
});

module.exports = {
  Book,
  Member,
  Attend,
  Review,
  Folder,
  List,
  DoneFolder,
  DoneList,
  Sort,
  Quote,
  Favorite,
  TS,
  POP,
  KPOP,
  HFC,
  KFC,
  HMC,
  KMC,
}

