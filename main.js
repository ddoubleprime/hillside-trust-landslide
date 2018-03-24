var g = new Phaser.Game(603,504,Phaser.AUTO, 'game');

g.state.add('boot', bootState);
g.state.add('load', loadState);
g.state.add('menu', menuState);
g.state.add('play', playState);

g.state.start('boot');
