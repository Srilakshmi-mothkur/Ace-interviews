"use client";
import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '../../../components/dialog';
import { Button } from '../../../components/button';
import { Input } from '../../../components/input';
import { Textarea } from '../../../components/textarea';
import { chatSession } from '../../../utils/GeminiAIModel';
import { LoaderCircle } from 'lucide-react';
import { db } from '../../../utils/db';
import { MockInterview } from '../../../utils/schema';
import { v4 as uuidv4 } from 'uuid';
import moment from 'moment';
import { useUser } from '@clerk/nextjs';

function AddNewInterview() {
    const [openDialog, setOpenDialog] = useState(false);
    const [jobPosition, setJobPosition] = useState('');
    const [jobDesc, setJobDesc] = useState('');
    const [jobExperience, setJobExperience] = useState('');
    const [loading, setLoading] = useState(false);
    const [jsonResponse, setJsonResponse] = useState([]);
    const { user } = useUser();

    const onSubmit = async (e) => {
        setLoading(true);
        e.preventDefault();
        console.log(jobPosition, jobDesc, jobExperience);

        const inputPrompt = `Job Position: ${jobPosition}, Job Description: ${jobDesc}, Years Of Experience: ${jobExperience}, Using the provided information give me ${process.env.NEXT_PUBLIC_INTERVIEW_QUESTION_COUNT} interview questions along with answers in JSON format. Provide "question" and "answer" fields in the JSON.`;

        try {
            const result = await chatSession.sendMessage(inputPrompt);
            const responseText = await result.response.text();
            const mockJsonResp = responseText.replace('```json', '').replace('```', '');
            const parsedJson = JSON.parse(mockJsonResp);
            console.log(parsedJson);
            setJsonResponse(parsedJson);

            if (parsedJson) {
                const createdBy = user?.primaryEmailAddress?.emailAddress;
                
                console.log("User object:", user);
                
                if (!createdBy) {
                    console.error("User email is not available. Cannot insert into the database.");
                    throw new Error("User email is not available.");
                }

                const resp = await db.insert(MockInterview)
                    .values({
                        mockId: uuidv4(),
                        jsonMockResp: mockJsonResp,
                        jobPosition: jobPosition,
                        jobDesc: jobDesc,
                        jobExperience: jobExperience,
                        createdBy: createdBy,
                        createdAt: moment().format('DD-MM-YYYY')
                    }).returning({ mockId: MockInterview.mockId });

                console.log("Inserted ID: ", resp);
                if(resp){
                    setOpenDialog(false);
                }
            } else {
                console.log("ERROR: Invalid JSON response");
            }
        } catch (error) {
            console.error("Error processing request: ", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div className='p-10 border rounded-lg bg-secondary hover:scale-105 hover:shadow-md cursor-pointer transition-all' onClick={() => setOpenDialog(true)}>
                <h2 className='text-lg text-center'>+ Add New</h2>
            </div>

            <Dialog open={openDialog}>
                <DialogContent className='max-w-2xl'>
                    <DialogHeader>
                        <DialogTitle className='text-2xl'>Provide Details About the Job You're Interviewing For</DialogTitle>
                        <DialogDescription>
                            <form onSubmit={onSubmit}>
                                <div>
                                    <h2>Add details about your Job Role, Job Description and Years of Experience</h2>
                                    <div className='mt-7 my-3'>
                                        <label className='block mb-2'>Job Role</label>
                                        <Input placeholder="Ex: ML Engineer" required onChange={(event) => setJobPosition(event.target.value)} />
                                    </div>
                                    <div className='mt-7 my-3'>
                                        <label className='block mb-2'>Job Description / Tech Stack</label>
                                        <Textarea placeholder="Ex: Python, TensorFlow, PyTorch, AWS, GCP, Build Deploy and Optimize Machine Learning models" required onChange={(event) => setJobDesc(event.target.value)} />
                                    </div>
                                    <div className='mt-7 my-3'>
                                        <label className='block mb-2'>Years Of Experience</label>
                                        <Input placeholder="Ex: 5" type="number" required onChange={(event) => setJobExperience(event.target.value)} />
                                    </div>
                                </div>
                                <div className='flex gap-5 justify-end'>
                                    <Button type="button" variant="ghost" size="sm" onClick={() => setOpenDialog(false)}>Cancel</Button>
                                    <Button size="sm" type="submit" disabled={loading}>
                                        {loading ?
                                            <>
                                                <LoaderCircle className='animate-spin' />Generating from AI...
                                            </>
                                            : 'Start Interview'}
                                    </Button>
                                </div>
                            </form>
                        </DialogDescription>
                    </DialogHeader>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default AddNewInterview;
