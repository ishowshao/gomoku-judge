/**
 * @param option
 * @constructor
 */
var Computer = function (option) {
    this.color = option.color;
    this.session = option.session;
    this.api = option.api;
};

/**
 * Get my move, param is adversary's move
 *
 * @param {Array|string} adversary
 */
Computer.prototype.move = function (adversary) {
    var me = this;
    $.ajax({
        url: this.api,
        data: {
            move: adversary === 'start' ? 'start' : adversary[0] + '-' + adversary[1],
            session: this.session,
            color: this.color
        },
        dataType: 'jsonp',
        jsonpCallback: 'go',
        success: function (move) {
            me.callback.call(null, move);
        }
    });
};

/**
 * Do callback when this player moved
 *
 * @param {Function} callback
 */
Computer.prototype.onMoved = function (callback) {
    this.callback = callback;
};

/**
 * @param option
 * @constructor
 */
var Person = function (option) {
    this.color = option.color;
    this.session = option.session;
    this.api = option.api;
};

/**
 * Get my move, param is adversary's move
 *
 * @param {Array} adversary
 */
Person.prototype.move = function (adversary) {
    console.log(adversary);
    var me = this;
    $('.chessboard').one('click', 'span', function () {
        console.log($(this).data('x'), $(this).data('y'));
        $(this).html('<i class="' + me.color + '"></i>');
        me.callback.call(null, [Number($(this).data('x')), Number($(this).data('y'))]);
    });
};

/**
 * Do callback when this player moved
 *
 * @param {Function} callback
 */
Person.prototype.onMoved = function (callback) {
    this.callback = callback;
};

/**
 * @constructor
 */
var Chessboard = function () {
    this.step = 0;
};

/**
 * 标准五子棋15路
 *
 * @type {number}
 */
Chessboard.SIZE = 15;

/**
 * 棋盘格子的大小，单位是像素
 *
 * @type {number}
 */
Chessboard.BLOCK_SIZE = 30;

/**
 * 渲染棋盘
 *
 * @param {HTMLElement} container
 */
Chessboard.prototype.render = function (container) {
    this.container = $(container);
    var size = Chessboard.SIZE;
    var blockSize = Chessboard.BLOCK_SIZE;
    var background = '<div class="background">';
    for (var i = 0; i < size - 1; i++) { // 线比格子多1，所以减掉
        background += '<div>';
        for (var j = 0; j < size - 1; j++) {
            background += '<span></span>';
        }
        background += '</div>';
    }
    background += '</div>';

    var chessboard = '<div class="chessboard">';
    for (i = 0; i < size; i++) {
        chessboard += '<div>';
        for (j = 0; j < size; j++) {
            chessboard += '<span data-y="' + i + '" data-x="' + j + '"></span>';
        }
        chessboard += '</div>';
    }
    chessboard += '</div>';

    this.container.html(background).find('.background').width((size - 1) * blockSize + (size - 1) - 1);
    this.container.append(chessboard);
    this.chessboard = this.container.find('.chessboard');
    this.chessboard.width(size * blockSize + size);
};

/**
 * 初始化棋盘事件
 */
Chessboard.prototype.initEvent = function () {
    this.chessboard.delegate('span', 'click', function () {
        console.log($(this).data('x'), $(this).data('y'));
        $(this).html('<i class="white"></i>');
    });
};

/**
 * 在棋盘上走棋
 *
 * @param {Array} position
 * @param {string} color
 */
Chessboard.prototype.go = function (position, color) {
    this.step++;
    this.chessboard.find('[data-x=' + position[0] + '][data-y=' + position[1] + ']').html('<i class="' + color + '">' + this.step + '</i>');
    console.log('Move', this.step, color, position);
};

/**
 * @class Game
 * @constructor
 */
var Game = function () {
    /**
     * @type {number}
     */
    this.mode = 1;

    /**
     * 如果人机对战，人默认是黑棋，界面上也是默认选中黑棋
     *
     * @type {string}
     */
    this.person = 'black';
};

/**
 * generate session id
 */
Game.id = function () {
    var chars = 'abcdefghijklmnopqrstuvwxyz0123456789'.split('');
    var id = '';
    for (var i = 0; i < 32; i++) {
        id += chars[Math.floor(Math.random() * chars.length)];
    }
    return id;
};

/**
 * init event
 */
Game.prototype.initEvent = function () {
    var me = this;

    $('[name=mode]').on('click', function () {
        me.mode = Number($(this).val());
        if (me.mode === 1) {
            $('#mode2').hide();
        } else {
            $('#mode1').hide();
        }
        $('#mode' + me.mode).show();
    });
    $('[name=person-color]').on('click', function () {
        me.person = $(this).val();
    });

    $('#start').click(function () {
        $(this).prop('disabled', true);
        me.start();
    });
};

/**
 * 初始化
 */
Game.prototype.init = function () {
    this.chessboard = new Chessboard();
    this.chessboard.render(document.getElementById('container'));
    this.chessboard.initEvent();

    this.initEvent();
};

/**
 * 开始游戏
 */
Game.prototype.start = function () {
    var me = this;

    // 为避免自己的AI相互对战产生问题，生成两个session id
    var sessionA = Game.id();
    var sessionB = Game.id();
    console.log('比赛开始', sessionA, sessionB);

    var nameA = $('[name=player-name-a]').val();
    var apiA = $('[name=player-api-a]').val();
    var nameB = $('[name=player-name-b]').val();
    var apiB = $('[name=player-api-b]').val();
    var namePerson = $('[name=person-name]').val();
    var nameAi = $('[name=ai-name]').val();
    var apiAi = $('[name=ai-api]').val();

    if (this.mode === 1) {
        var playerA = new Computer({
            name: nameA,
            color: 'black',
            session: sessionA,
            api: apiA
        });
        playerA.move('start');
        playerA.onMoved(function (move) {
            me.chessboard.go(move, 'black');
            if (move[0] === -1 || move[1] === -1) {
                console.log('Game over: Player A failed.');
            } else {
                playerB.move(move);
            }
        });

        var playerB = new Computer({
            name: nameB,
            color: 'white',
            session: sessionB,
            api: apiB
        });
        playerB.onMoved(function (move) {
            me.chessboard.go(move, 'white');
            if (move[0] === -1 || move[1] === -1) {
                console.log('Game over: Player B failed.');
            } else {
                playerA.move(move);
            }
        });
    } else {
        console.log('人', me.person);
        var person = new Person({
            name: namePerson,
            color: me.person
        });
        person.onMoved(function (move) {
            me.chessboard.go(move, me.person);
            if (move[0] === -1 || move[1] === -1) {
                console.log('Game over: Person failed.');
            } else {
                ai.move(move);
            }
        });
        var ai = new Computer({
            name: nameAi,
            color: me.person === 'black' ? 'white' : 'black',
            session: sessionA,
            api: apiAi
        });
        ai.onMoved(function (move) {
            me.chessboard.go(move, ai.color);
            if (move[0] === -1 || move[1] === -1) {
                console.log('Game over: AI failed.');
            } else {
                person.move(move);
            }
        });
        if (person.color === 'black') {
            person.move();
        } else {
            ai.move('start');
        }
    }
};


// main
new Game().init();