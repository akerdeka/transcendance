import React, { useEffect, useState } from "react";
import { useCookies } from "react-cookie";
import { io, Socket } from "socket.io-client";
import { isLogged } from "../../utils/isLogged";
import { RequestApi } from "../../utils/RequestApi.class";
import './mainMenu.css'

import { useHistory } from "react-router";
import { UserCircle, Play as Challenge, ChevronDoubleUp, Trash, VolumeOff, Cog } from "heroicons-react";
import { User } from "../../utils/user.type";
import { useForceUpdate } from "../../utils/forceUpdate";
const ip = window.location.hostname;

type MessageType = {
	id: number;
	sentAt: string;
	sender: string;
	body: string;
	avatar: string;
}

export function MainMenu() {
	let history = useHistory();
	const [cookies] = useCookies();
	const [messages, setMessages] = useState<MessageType[]>([]);
	const [messageInput, setMessageInput] = useState<string>('');
	const [current_channel, setCurrent_Channel] = useState<string>('');
	const [channels] = useState<string[]>([]);
	const [channelName, setChannelName] = useState<string>('');
	const [channelPassword, setChannelPassword] = useState<string>('');
	const [popupState, setPopupState] = useState<number>(0);
	const [showPopup, setShowPopup] = useState<boolean>(false);
	const [me, setMe] = useState<User>();
	const [socket, setSocket] = useState<Socket>();

	const requestApi = new RequestApi(cookies.access_token, ip);

	const forceUpdate = useForceUpdate();

	useEffect(() => {
		let mount = true;
		if (mount) {
			isLogged(cookies).then((res) => { setMe(res.me.data); });
			setSocket(io(`ws://${ip}:5001`, { transports: ['websocket'] }));
			requestApi.get('user/channels/connected').then((response) => {
				response.channelsConnected.map((chan: any) => 
					channels.push(chan.name)
				)
			})
		}
		return (() => { mount = false; });
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [cookies]);

	useEffect(() => {
		let mount = true;
		if (mount) {
			if (socket) {

				socket.on(`msg_toClient/${current_channel}`, (msg: any) => {
					console.log(`msg: ${msg}`);
					messages.push({ id: messages.length, sentAt: msg.sentAt, sender: msg.sender.username, body: msg.body, avatar: msg.sender.profileImage });
					forceUpdate();
				})
			}
		}
		return (() => { mount = false; });
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [socket, cookies, messages]);



	function togglePopup() {
		setShowPopup(!showPopup);
	}

	function handleCreateNewChannel(e: any) {
		if (channelName === "") {
			window.alert("Channel's name cannot be empty !")
		}
		else {
			if (channels.find((name: string) => (name === channelName))) {
				window.alert("Channel's name already taken !")
			}
			else {
				const data = {
					name: channelName,
					password: channelPassword,
				}
				requestApi.post('channel/create', { body: data, contentType: 'application/json' });

				channels.push(channelName);
				if (socket) {
					socket.emit('change_channel', { channelName: channelName });
					setCurrent_Channel(channelName);
				}
				setMessages([]);
				togglePopup();
				setChannelName('');
				setChannelPassword('');
				setPopupState(0);
			}
		}
		e.preventDefault()
	}

	function handleJoinChannel(e: any) {
		if (channelName === "") {
			window.alert("Channel's name cannot be empty !")
		}
		else {
			const data = {
				name: channelName,
				password: channelPassword,
			}
			requestApi.patch('channel/join', { body: data, contentType: 'application/json' });

			channels.push(channelName);
			if (socket) {
				socket.emit('change_channel', { channelName: channelName });
				setCurrent_Channel(channelName);
			}
			setMessages([]);
			togglePopup();
			setChannelName('');
			setChannelPassword('');
			setPopupState(0);
		}
		e.preventDefault()
	}

	function handleSendMessage(e: React.FormEvent<HTMLFormElement>) {
		if (messageInput) {
			console.log(messageInput);
			if (socket) {
				socket.emit('msg_toServer', { sentAt: Date(), body: messageInput, receiver: null });
				console.log(`msg_toClient/${current_channel}`);
			}
			setMessageInput('');
		}
		e.preventDefault();
	}


	useEffect(() => {
		let mount = true;
		if (mount) {
			if (current_channel) {
				requestApi.get(`channel/messages/${current_channel}`).then((response) => {
					response.messages.map((msg: any) =>
						messages.push({ id: messages.length, sentAt: msg.date, sender: msg.sender.username, body: msg.content, avatar: msg.sender.profileImage })
					);
					forceUpdate();
				})
			}
		}
		return (() => { mount = false; });
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [cookies, messages, current_channel]);

	function changeChannel(e: any) {
		console.log(e.target.innerText);
		if (socket) {
			socket.emit('change_channel', { channelName: e.target.innerText });
			setCurrent_Channel(e.target.innerText);
		}
		setMessages([]);
		e.preventDefault();
	}

	function handleRedirectToProfile(toGo: string) {
		return history.push(`/${toGo}/profile`)
	}


	return (
		<div className="MainElement" >
			<div className="Channel List" >{channels.map((channel: any) => (
				<p key={channel} onClick={changeChannel} className="channelName">{channel}</p>
			))}
				<button className="addChannel" onClick={togglePopup}>+</button>
			</div>
			<div className="Message Container" >
				{console.log(messages)}
				{messages.map((message: any) =>
				(
					<article key={message.id} className='message-container'>
						<div className="img-content" >
							<img className="message-image" style={{ backgroundImage: `url(${message.avatar})` }} alt="" />
							<div className="message-body" >
								<header className='message-header'>
									<h4 className='message-sender' onClick={e => handleRedirectToProfile(message.sender)} >{(me && message.sender === me.username) ? 'You' : message.sender}</h4>
									<span className='message-time'>
										{new Date(message.sentAt).toLocaleTimeString(undefined, { timeStyle: 'short' })}
									</span>
								</header>
								<p className='message-text'>{message.body}</p>
							</div>
						</div>
						<div className="dropdown" >
							<Cog className="dropbtn" />
							<div className="dropdown-content">
								<UserCircle className="chatUserParam" onClick={(e) => { return history.push(`/${message.sender}/profile`) }} />
								<Challenge className="chatUserParam" />
								<ChevronDoubleUp className="chatUserParam" />
								<VolumeOff className="chatUserParam" />
								<Trash className="chatUserParam" />
							</div>
						</div>
					</article>
				))}
			</div>
			<form onSubmit={handleSendMessage} >
				<input type="text" className="MainSendMessage" placeholder="Message..." value={messageInput} onChange={(e) => setMessageInput(e.target.value)} />
			</form>
			{showPopup ? <div className="Popup inner">
				<div className="Chan Popup">
					{popupState === 0 ?
						<div className="AJCbtn" >
							<button className="AddJoinChan" onClick={(e) => { setPopupState(1) }}> <img className="AddJoinImg" alt="" src="img/CreateServer.svg" />Create your channel</button>
							<button className="AddJoinChan" onClick={(e) => { setPopupState(2) }} > <img className="AddJoinImg" alt="" src="img/JoinServer.svg" />Join a channel</button>
						</div>
						:
						popupState === 1 ?
							<div className="AddChan">
								<form onSubmit={handleCreateNewChannel} >
									<input type="text" className="AJCplaceholder" placeholder="Channel name" value={channelName} onChange={(e) => { setChannelName(e.target.value) }} />
									<input type="password" className="AJCplaceholder" placeholder="Password (optionnal)" value={channelPassword} onChange={(e) => (setChannelPassword(e.target.value))} />
									<input type="submit" className="subbtn" value="Create !" />
								</form>
								<button className="Backbtn" onClick={(e) => { setChannelName(''); setChannelPassword(''); setPopupState(0) }}>Back</button>
							</div>
							:
							<div className="JoinChan">
								<form onSubmit={handleJoinChannel} >
									<input type="text" className="AJCplaceholder" placeholder="Channel name" value={channelName} onChange={(e) => setChannelName(e.target.value)} />
									<input type="password" className="AJCplaceholder" placeholder="Password (optionnal)" value={channelPassword} onChange={(e) => setChannelPassword(e.target.value)} />
									<input type="submit" className="subbtn" value="Create !" />
								</form>
								<button className="Backbtn" onClick={(e) => { setPopupState(0) }} >Back</button>
							</div>
					}
					<button className="Cancelbtn" onClick={(e) => { togglePopup(); setPopupState(0) }} >Cancel</button>
				</div>
			</div> : null}
		</div>
	)
}
