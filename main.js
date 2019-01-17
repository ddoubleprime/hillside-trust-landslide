var g = new Phaser.Game(603,504,Phaser.AUTO, 'game');
//g.advancedTiming

g.state.add('boot', bootState);
g.state.add('load', loadState);
g.state.add('menu', menuState);
g.state.add('play', playState);
//g.state.add('play2',playState2);

g.state.start('boot');
