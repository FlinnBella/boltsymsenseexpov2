import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';







export default function InfoWorkflow() {
    const [activeStep, setActiveStep] = useState(0);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        gender: '',
        userType: '',
        phoneNumber: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        dateOfBirth: '',
    });
    const CheckEmail = async () => {
        const { data, error } = await supabase.auth.getUser();
        if (data.user) {
            setActiveStep(1);
        }
        if (error) {
            Alert.alert('Please verify your email', error.message);
        }
    }
    return (
        <View>
            <View>
            <Text>Info Workflow: Press the button once you've verified your email</Text>
            <TouchableOpacity onPress={CheckEmail}>
                <Text>Email Verified</Text>
            </TouchableOpacity>
            </View>
        {activeStep === 1 ? (
            <>
            <View>
                <TextInput
                    placeholder="Email"
                    value={formData.email}
                    onChangeText={(text) => setFormData({ ...formData, email: text })}
                />
            </View>
            <TouchableOpacity onPress={() => setActiveStep(2)}>Next</TouchableOpacity>
            </>
        ) : null}
        {activeStep === 2 ? (
            <>
            <View>
                <TextInput
                    placeholder="Gender"
                    value={formData.gender}
                    onChangeText={(text) => setFormData({ ...formData, gender: text })}
                />
            </View>
            <View>
                <TextInput
                    placeholder="Date of Birth"
                    value={formData.dateOfBirth}
                    onChangeText={(text) => setFormData({ ...formData, dateOfBirth: text })}
                />
            </View>
            <View>
                <TextInput
                    placeholder="User Type"
                    value={formData.userType}
                    onChangeText={(text) => setFormData({ ...formData, userType: text })}
                />
            </View>
            <TouchableOpacity onPress={() => setActiveStep(3)}>Next</TouchableOpacity>
            </>
        ) : null}
        {activeStep === 3 ? (
            <>
            <View>
                <TextInput
                    placeholder="Phone Number"
                    value={formData.phoneNumber}
                    onChangeText={(text) => setFormData({ ...formData, phoneNumber: text })}
            />
            </View>
            </>
                
        ) : null}
        </View>
    );
}