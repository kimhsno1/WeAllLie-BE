const GameRepo = require('./game-repo');
const redis = require('../redis');
const shuffle = require('shuffle-array');

class GameProvider {
    getSpy = async (roomNum) => {
        return await GameRepo.getSpy(roomNum);
    };

    catchSpy = async (nickname) => {
        return await GameRepo.catchSpy(nickname);
    };

    setPlayCount = async (nickname) => {
        await GameRepo.setPlayCount(nickname);
    };

    setVoteResult = async (roomNum, nickname) => {
        await redis.lpush(`gameRoom${roomNum}Result`, [nickname]);
        console.log('voteResult : ', await redis.lrange(`gameRoom${roomNum}Result`, 0, -1));
    };

    getResult = async (roomNum) => {
        // 투표 집계한 배열.
        const resultList = await redis.lrange(`gameRoom${roomNum}Result`, 0, -1);
        // 방에 참여 중인 유저 닉네임.
        const roomUsers = await redis.lrange(`gameRoom${roomNum}Users`, 0, -1);
        // spy 유저인 닉네임.
        const spyUser = await GameRepo.getSpy(roomNum);

        // 가장 표를 많이 받은 사람의 ['nickname', 투표받은 수]
        let maxVoteUser = ['', 0];

        for (let user of roomUsers) {
            let count = 0;
            resultList.forEach((vote) => {
                if (vote === user) count++;
            });
            if (count > maxVoteUser[1]) {
                maxVoteUser[0] = user;
                maxVoteUser[1] = count;
            }
        }
        // 게임이 끝난 후 redis 메모리 확보.
        await redis.del(`gameRoom${roomNum}Result`);
        await redis.del(`gameRoom${roomNum}Users`);

        // 가장 많이 표를 받은 사람이 spy 면 true, 아니면 false return.
        return {
            spyWin: maxVoteUser[0] === spyUser,
            maxVoteUser: maxVoteUser[0],
            maxVoteResult: maxVoteUser[1],
        };
    };

    // 각 방에 참여한 유저들의 닉네임 저장.
    setRoomUsers = async (roomNum, nickname) => {
        // roomUsers 가 존재하는 지 확인.
        const roomExist = await redis.exists(`gameRoom${roomNum}Users`);
        if (roomExist === 0) {
            // 없으면 생성 후 유저 닉네임 넣기.
            await redis.rpush(`gameRoom${roomNum}Users`, [nickname]);
        } else {
            // 있으면 그 key 에 닉네임 push.
            await redis.rpush(`gameRoom${roomNum}Users`, [nickname]);
        }
        console.log('roomUsers : ', await redis.lrange(`gameRoom${roomNum}Users`, 0, -1));
    };

    selectSpy = async (nickname) => {
        // const spyUser = await GameRepo.selectSpy(nickname);
        // let result = [];
        // for (let i = 0; i < spyUser.length; i++) {
        //     result.push(spyUser[i]);
        // }
        // shuffle(result);
        // let spy = result.slice(-1);
        // return spy;
    };

    //정답 단어 보여주기 //if스파이면 단어랑 카테고리 안보여주기
    giveWord = async (category, word) => {
        // if (isSpy) {
        //     return {'message': '시민들이 정답 단어 확인 중 입니다.'};
        // }
        const givecategory = await GameRepo.giveWord(category);
        let answer = [];

        for (let i = 0; i < givecategory.length; i++) {
            answer.push(givecategory[i]);
        }

        shuffle(answer);
        let categoryFix = answer.slice(-1);
        return shuffle(categoryFix);

        //주어진 categoryFix 안의 단어들 랜덤으로 1개 지정
        // const giveWord = await GameRepo.giveWord(word);

        // let result = []
        // for (let i = 0; i < giveWord.length; i++) {
        //     result.push(giveWord[i]);
        // }

        // shuffle(result);
        // let answerWord = result.slice(-1);
        // return answerWord;
    };
    // 카테고리 픽스안의 단어 보여주기 //스파이도 보여주기
    //단어 랜덤으로 보여주기
    giveExample = async (word) => {
        const gameCategory = await GameRepo.giveExample(category);
        let result = [];

        for (let i = 0; i < gameCategory.length; i++) {
            result.push(gameCategory[i]);
        }

        shuffle(result);
        let categoryFix = result.slice(0, 20);
        return shuffle(categoryFix);
    };

    //발언권 랜덤 설정
    //발언권 처음 랜덤 설정 / 45초 발언권 / 발언 후 넘길 사람 선택 안할 시 if !click -> 5초후 random 으로 발언권 부여 / 이미 발언 한 사람은 발언 못함 if click de hua bu ke neng check
    micToss = async (nickname) => {
        const micToss = await GameRepo.micToss(nickname);

        let timer;
        setTimeout(() => {
            console.log(`발언시간이 끝났습니다.`);
            clearInterval(timer);
        }, 45000);

        let result = [];
        for (let i = 0; i < micToss.length; i++) {
            result.push(micToss[i]);
        }

        shuffle(result);
        let randomStart = result.slice(-1);
        return randomStart;
    };
}

module.exports = new GameProvider();
