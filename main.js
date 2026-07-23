import { SkyWayContext, SkyWayRoom, SkyWayStreamFactory, LocalVideoStream } from '@skyway-sdk/room';

// ⚠️ 必ず自分のAPIキーに置き換える
const API_KEY = '77088e00-0018-4668-9bca-4bb642769469';

const roomNameInput = document.getElementById('roomNameInput');
const joinRoomBtn = document.getElementById('joinRoomBtn');
const viewRoomBtn = document.getElementById('viewRoomBtn');
const localVideo = document.getElementById('localVideo');
const errorMessage = document.getElementById('errorMessage');

function showError(msg) {
    errorMessage.textContent = msg;
}

// ---- ホスト（画面共有） ----
joinRoomBtn.onclick = async () => {
    const roomName = roomNameInput.value || 'my-room';
    try {
        const context = await SkyWayContext.Create(API_KEY);
        const room = await SkyWayRoom.FindOrCreate(context, {
            name: roomName,
            type: 'sfu',
        });
        const member = await room.join();

        const { video } = await SkyWayStreamFactory.createDisplayStreams({
            video: { displaySurface: 'monitor' }
        });

        const localVideoStream = new LocalVideoStream(video);
        await localVideoStream.attach(localVideo);
        await localVideoStream.play();
        await member.publish(video);

        console.log(`✅ ホスト参加成功: ${roomName}`);
    } catch (error) {
        console.error(error);
        showError(`ホストエラー: ${error.message}`);
    }
};

// ---- 視聴者 ----
viewRoomBtn.onclick = async () => {
    const roomName = roomNameInput.value || 'my-room';
    try {
        const context = await SkyWayContext.Create(API_KEY);
        const room = await SkyWayRoom.FindOrCreate(context, {
            name: roomName,
            type: 'sfu',
        });
        const member = await room.join();

        for (const publication of member.publications) {
            if (publication.stream && publication.stream.contentType === 'video') {
                const subscription = await member.subscribe(publication.id);
                const remoteVideoStream = new LocalVideoStream(subscription.stream);
                await remoteVideoStream.attach(localVideo);
                await remoteVideoStream.play();
                console.log(`✅ 視聴者参加成功: ${roomName}`);
                return;
            }
        }
        showError('ルームに共有画面が見つかりませんでした。');
    } catch (error) {
        console.error(error);
        showError(`視聴者エラー: ${error.message}`);
    }
};
