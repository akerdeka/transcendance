import React, { ReactElement } from 'react'
import { usernews } from './usernews'
import { Displayfriend } from './props'

function FriendList(): ReactElement {
    return (
        <div className="top-13% absolute right-5% h-60% w-15% font-sans text-white text-center text-xl sm:text-sm md:text-3xl opacity-60">
            <div className="bg-Banner h-full w-full overflow-y-scroll scrollbar-hide rounded-2xl">
                {usernews.map(({ user, msg, img, connect }: { user: string, msg: string, img: string, connect: number }) => (
                    <Displayfriend
                        user={user}
                        msg={msg}
                        img={img}
                        connect={connect}
                    />
                ))}
            </div>
        </div>
    )
}

export default FriendList