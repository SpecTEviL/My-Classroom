import { useState, useEffect } from 'react';
import { channelName, config, useClient, useMicrophoneAndCameraTracks } from "./settings";
import Video from "./Video";
import Controls from "./Controls";
import { Grid } from "@material-ui/core";

export default function VideoCall(props){
    const { setInCall } = props;
    const [users, setUsers] = useState([]);
    const [start, setStart] = useState(false);
    const client = useClient();
    const { ready, tracks } = useMicrophoneAndCameraTracks();

    useEffect(() => {
        let init = async (name) => {
            client.on("user-published", async(user, mediaType) => {
                await client.subscribe(user, mediaType);
                if(mediaType === "video"){
                    setUsers((prevUsers) => {
                        return [...prevUsers, user];
                    });
                }
                if(mediaType === 'audio'){
                    user.audioTrack.play();
                }
            });

            client.on("user-unpublished", (user, mediatype) => {
                if(mediatype === "audio"){
                    if(user.audioTrack) user.audioTrack.stop();
                }
                if(mediatype === 'video'){
                    setUsers((prevUsers) => {
                        return prevUsers.filter((User) => User.uid !== user.uid);
                    });
                }
            });

            client.on("user-left", (user)=>{
                setUsers((prevUsers) => {
                    return prevUsers.filter((User) => User.uid !== user.uid);
                });
            });

            try {
                await client.join(config.appId, name, config.token, null)
            } catch(error){
                console.log("error");
            }

            if(tracks) await client.publish([tracks[0], tracks[1]]);
            setStart(true);
        };

        if(ready && tracks){
            try{
                init(channelName);
            } catch(error){
                console.log(error);
            }
        }
    }, [client, ready, tracks]);

    return (
        <Grid container direction="column" style={{height: "100%"}}>
            <Grid item style={{height: "10%"}}>
                { ready && tracks && (
                    <Controls tracks={tracks} setStart={setStart} setInCall={setInCall} />
                )}
            </Grid>
            <Grid item style={{height: "90%"}}>
                { start && tracks && <Video tracks={tracks} users={users} />}
            </Grid>
        </Grid>
    )
}